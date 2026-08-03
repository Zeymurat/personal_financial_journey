"""
Finans API (finans.truncgil.com) Döviz Kurları Servisi
Birincil: https://finans.truncgil.com/v4/today.json
Yedek:    https://finans.truncgil.com/v3/today.json  (v4 boş/hatalıysa)
"""
import logging
from typing import Dict, Any, Optional
import requests
from datetime import datetime, time
import json
import re

logger = logging.getLogger(__name__)

FINANS_API_URL_V4 = "https://finans.truncgil.com/v4/today.json"
FINANS_API_URL_V3 = "https://finans.truncgil.com/v3/today.json"
# Geriye dönük alias
FINANS_API_URL = FINANS_API_URL_V4

# Zamanlama kontrolü için saatler (Döviz kurları güncelleme saatleri)
# Borsa ile aynı saatler: 10:00, 13:30, 17:00
FETCH_TIMES = [
    time(10, 0),   # 10:00 - İlk seans başlangıcı
    time(13, 30),  # 13:30 - Öğle arası sonrası
    time(17, 0),   # 17:00 - İkinci seans sonu
]


def parse_tr_number(value: Any) -> float:
    """
    Truncgil v3 string ("47,5248", "%0,03", "$4.055,91") ve v4 sayılarını float'a çevirir.
    """
    if value is None:
        return 0.0
    if isinstance(value, bool):
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)

    s = str(value).strip()
    if not s:
        return 0.0

    s = s.replace('%', '').replace('$', '').replace('₺', '').replace(' ', '')
    s = re.sub(r'[^\d,.\-]', '', s)
    if not s or s in ('-', '.', ','):
        return 0.0

    # TR: 6.197,61 → binlik nokta, ondalık virgül
    if ',' in s and '.' in s:
        s = s.replace('.', '').replace(',', '.')
    elif ',' in s:
        s = s.replace(',', '.')

    try:
        return float(s)
    except ValueError:
        return 0.0


def _raw_payload_has_rates(data: dict) -> bool:
    """Sadece Update_Date olan boş v4 cevabını reddet."""
    if not isinstance(data, dict):
        return False
    for key, val in data.items():
        if key == 'Update_Date':
            continue
        if isinstance(val, dict) and (
            val.get('Type')
            or val.get('Buying') is not None
            or val.get('Selling') is not None
        ):
            return True
    return False


class TCMBService:
    """Finans API'sinden döviz kurlarını, altın fiyatlarını ve kripto paraları çeken servis sınıfı"""
    
    def __init__(self):
        self.session = requests.Session()
    
    def should_fetch_data(self) -> bool:
        """
        Şu anki saat, veri çekme saatlerinden birine uyuyor mu kontrol eder.
        
        Returns:
            True if current time matches one of the fetch times, False otherwise
        """
        now = datetime.now()
        current_time = now.time()
        
        # Her fetch zamanı için ±5 dakika tolerans
        for fetch_time in FETCH_TIMES:
            time_diff = abs(
                (current_time.hour * 60 + current_time.minute) - 
                (fetch_time.hour * 60 + fetch_time.minute)
            )
            if time_diff <= 5:  # 5 dakika tolerans
                return True
        
        return False
    
    def should_fetch_new_data(self, existing_fetch_time: Optional[str] = None) -> bool:
        """
        Yeni veri çekilmeli mi kontrol eder.
        
        FETCH SAATLERİ: 10:00, 13:30, 17:00 (hafta içi)
        
        Mantık:
        1. Bugün için veri yoksa:
           - Saat >= 10:00 ise → Veri çek
           - Saat < 10:00 ise → Veri çekme (henüz ilk fetch saati gelmedi)
        
        2. Bugün için veri varsa:
           - Son çekim 10:00-13:30 arasındaysa:
             * Saat >= 14:00 ise → Veri çek (13:30'u kaçırdık, bir sonraki fetch saati)
             * Saat < 14:00 ise → Veri çekme (henüz bir sonraki fetch saati gelmedi)
           - Son çekim 13:30-17:00 arasındaysa:
             * Saat >= 17:00 ise → Veri çek (17:00'ü kaçırdık, bir sonraki fetch saati)
             * Saat < 17:00 ise → Veri çekme (henüz bir sonraki fetch saati gelmedi)
           - Son çekim 17:00'den sonraysa:
             * Bugün için veri çekme (günün son verisi zaten çekilmiş, yarın 10:00'da tekrar çekilecek)
        
        Örnek Senaryolar:
        - Saat 09:00, bugün için veri yok → Cache kullan (henüz 10:00 gelmedi)
        - Saat 10:30, bugün için veri yok → API'den çek (10:00 geçti)
        - Saat 11:00, son çekim 10:15 → Cache kullan (henüz 13:30 gelmedi)
        - Saat 14:30, son çekim 10:15 → API'den çek (13:30 geçti, yeni veri gerekli)
        - Saat 18:00, son çekim 17:15 → Cache kullan (günün son verisi zaten var)
        
        Args:
            existing_fetch_time: Cache'den gelen fetch_time (örn: "2025-11-05 10:23:46")
        
        Returns:
            True if new data should be fetched, False otherwise
        """
        now = datetime.now()
        today = now.strftime('%Y-%m-%d')
        current_time = now.time()
        current_minutes = current_time.hour * 60 + current_time.minute
        
        # Hafta sonu kontrolü
        if not self.is_weekday():
            return False
        
        # Fetch saatleri
        FETCH_10_00 = 10 * 60  # 600 dakika
        FETCH_13_30 = 13 * 60 + 30  # 810 dakika
        FETCH_14_00 = 14 * 60  # 840 dakika
        FETCH_17_00 = 17 * 60  # 1020 dakika
        
        # Mevcut fetch_time'ı parse et ve bugünün verisi olup olmadığını kontrol et
        fetch_date = None
        fetch_time_minutes = None
        
        if existing_fetch_time:
            try:
                # fetch_time formatı: "2025-11-05 10:23:46" veya "10:23:46"
                if ' ' in existing_fetch_time:
                    fetch_date_str = existing_fetch_time.split(' ')[0]  # "2025-11-05"
                    fetch_datetime_str = existing_fetch_time.split(' ')[1]  # "10:23:46"
                else:
                    fetch_date_str = None
                    fetch_datetime_str = existing_fetch_time  # "10:23:46"
                
                # Saat ve dakikayı parse et
                time_parts = fetch_datetime_str.split(':')
                fetch_hour = int(time_parts[0])
                fetch_minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                fetch_time_minutes = fetch_hour * 60 + fetch_minute
                
                # Eğer tarih bilgisi varsa, bugünün verisi olup olmadığını kontrol et
                if fetch_date_str:
                    fetch_date = fetch_date_str
            except Exception:
                existing_fetch_time = None
        
        # Durum 1: Bugün için veri yok
        if not existing_fetch_time or (fetch_date and fetch_date != today):
            # Saat >= 10:00 ise → Veri çek
            return current_minutes >= FETCH_10_00
        
        # Durum 2: Bugün için veri var
        if fetch_time_minutes is None:
            return False
        
        # Son çekim saati hangi aralıkta?
        if FETCH_10_00 <= fetch_time_minutes < FETCH_13_30:
            # Saat >= 14:00 ise → Veri çek (13:30'u kaçırdık)
            return current_minutes >= FETCH_14_00
        
        elif FETCH_13_30 <= fetch_time_minutes < FETCH_17_00:
            # Saat >= 17:00 ise → Veri çek (17:00'ü kaçırdık)
            return current_minutes >= FETCH_17_00
        
        elif fetch_time_minutes >= FETCH_17_00:
            # Günün son verisi zaten çekilmiş
            return False
        
        else:
            # Son çekim 10:00'dan önceyse (beklenmedik durum)
            return True
    
    def is_weekday(self) -> bool:
        """
        Bugün hafta içi mi kontrol eder (Pazartesi-Cuma).
        
        Returns:
            True if weekday, False otherwise
        """
        now = datetime.now()
        return now.weekday() < 5  # 0=Monday, 4=Friday
    
    def _fetch_raw_json(self, url: str) -> Optional[dict]:
        """Tek Truncgil endpoint'inden JSON alır."""
        try:
            response = self.session.get(
                url,
                timeout=60,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Connection': 'keep-alive',
                },
                stream=False,
            )
            if response.status_code != 200:
                logger.error("Finans API HTTP %s | url=%s", response.status_code, url)
                return None

            content_length = response.headers.get('Content-Length')
            actual_length = len(response.content)
            response_text = (response.text or '').strip()
            is_truncated = bool(response_text) and not response_text.endswith('}')
            if content_length and int(content_length) > actual_length:
                is_truncated = True

            try:
                data = response.json()
            except (json.JSONDecodeError, ValueError):
                if is_truncated:
                    logger.warning(
                        "Finans API response kesilmiş (len=%s) | url=%s",
                        actual_length,
                        url,
                    )
                    return None
                try:
                    data = json.loads(response.content.decode('utf-8', errors='ignore'))
                except Exception:
                    logger.warning("Finans API JSON parse hatası | url=%s", url)
                    return None

            if not isinstance(data, dict):
                return None
            return data
        except Exception as e:
            logger.error("Finans API istek hatası | url=%s | %s", url, e)
            return None

    def _parse_rates_payload(self, data: dict, source_label: str) -> Optional[Dict[str, Any]]:
        """Truncgil today.json gövdesini iç modele çevirir (v3/v4)."""
        if not _raw_payload_has_rates(data):
            return None

        update_date = data.get('Update_Date', '') or ''
        result: Dict[str, Any] = {
            'currencies': {},
            'gold_prices': {},
            'crypto_currencies': {},
            'precious_metals': {},
            'timestamp': datetime.now().isoformat(),
            'fetch_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'source': source_label,
            'update_date': update_date,
        }

        currency_count = 0
        gold_count = 0
        crypto_count = 0
        metal_count = 0

        for code, item_data in data.items():
            if code == 'Update_Date':
                continue
            if not isinstance(item_data, dict):
                continue

            item_type = item_data.get('Type', '') or ''
            name = item_data.get('Name', code) or code
            change = parse_tr_number(item_data.get('Change', 0))

            # v3: platin/paladyum bazen Type=Gold — metal kodlarına ayır
            code_l = str(code).lower()
            if item_type == 'Gold' and (
                'platin' in code_l or 'platinum' in code_l
            ):
                item_type = 'Platinum'
            elif item_type == 'Gold' and (
                'paladyum' in code_l or 'palladium' in code_l
            ):
                item_type = 'Palladium'

            if item_type == 'Currency':
                buying = parse_tr_number(item_data.get('Buying', 0))
                selling = parse_tr_number(item_data.get('Selling', 0))
                avg_rate = (
                    (buying + selling) / 2
                    if (buying > 0 and selling > 0)
                    else (buying if buying > 0 else selling)
                )
                result['currencies'][code] = {
                    'code': code,
                    'name': name,
                    'name_tr': name,
                    'rate': avg_rate,
                    'buy': buying,
                    'sell': selling,
                    'change': change,
                    'type': 'currency',
                }
                currency_count += 1

            elif item_type == 'Gold':
                buying = parse_tr_number(item_data.get('Buying', 0))
                selling = parse_tr_number(item_data.get('Selling', 0))
                if buying == 0 and selling > 0:
                    buying = selling
                elif selling == 0 and buying > 0:
                    selling = buying
                avg_price = (
                    (buying + selling) / 2
                    if (buying > 0 and selling > 0)
                    else (buying if buying > 0 else selling)
                )
                result['gold_prices'][code] = {
                    'code': code,
                    'name': name,
                    'name_tr': name,
                    'rate': avg_price,
                    'buy': buying,
                    'sell': selling,
                    'change': change,
                    'type': 'gold',
                }
                gold_count += 1

            elif item_type == 'CryptoCurrency':
                usd_price = parse_tr_number(item_data.get('USD_Price', 0))
                try_price = parse_tr_number(item_data.get('TRY_Price', 0))
                selling = parse_tr_number(item_data.get('Selling', try_price))
                if try_price == 0 and selling > 0:
                    try_price = selling
                result['crypto_currencies'][code] = {
                    'code': code,
                    'name': name,
                    'name_tr': name,
                    'rate': try_price,
                    'buy': try_price,
                    'sell': selling if selling else try_price,
                    'usd_price': usd_price,
                    'change': change,
                    'type': 'crypto',
                }
                crypto_count += 1

            elif item_type == 'Platinum':
                buying = parse_tr_number(item_data.get('Buying', 0))
                selling = parse_tr_number(item_data.get('Selling', 0))
                avg_price = (
                    (buying + selling) / 2
                    if (buying > 0 and selling > 0)
                    else (buying if buying > 0 else selling)
                )
                result['precious_metals'][code] = {
                    'code': code,
                    'name': name,
                    'name_tr': name,
                    'rate': avg_price,
                    'buy': buying,
                    'sell': selling,
                    'change': change,
                    'type': 'platinum',
                }
                metal_count += 1

            elif item_type == 'Palladium':
                buying = parse_tr_number(item_data.get('Buying', 0))
                selling = parse_tr_number(item_data.get('Selling', 0))
                avg_price = (
                    (buying + selling) / 2
                    if (buying > 0 and selling > 0)
                    else (buying if buying > 0 else selling)
                )
                result['precious_metals'][code] = {
                    'code': code,
                    'name': name,
                    'name_tr': name,
                    'rate': avg_price,
                    'buy': buying,
                    'sell': selling,
                    'change': change,
                    'type': 'palladium',
                }
                metal_count += 1

        if currency_count == 0 and gold_count == 0 and crypto_count == 0 and metal_count == 0:
            return None

        result['currencies']['TRY'] = {
            'code': 'TRY',
            'name': 'Turkish Lira',
            'name_tr': 'TÜRK LİRASI',
            'rate': 1,
            'buy': 1,
            'sell': 1,
            'change': 0,
            'type': 'currency',
        }
        result['date'] = update_date.split(' ')[0] if update_date else ''
        result['date_en'] = update_date
        logger.info(
            "Finans API parse OK | source=%s | fx=%s gold=%s crypto=%s metal=%s",
            source_label,
            currency_count,
            gold_count,
            crypto_count,
            metal_count,
        )
        return result

    def get_exchange_rates(self) -> Optional[Dict[str, Any]]:
        """
        Finans API'den güncel kurları alır.
        Önce v4; boş/hatalıysa v3 (string sayı formatı normalize edilir).
        """
        try:
            raw_v4 = self._fetch_raw_json(FINANS_API_URL_V4)
            if raw_v4:
                parsed = self._parse_rates_payload(raw_v4, 'Finans API v4')
                if parsed:
                    return parsed
                logger.warning(
                    "Finans API v4 boş veya geçersiz (örn. sadece Update_Date); v3 deneniyor"
                )
            else:
                logger.warning("Finans API v4 alınamadı; v3 deneniyor")

            raw_v3 = self._fetch_raw_json(FINANS_API_URL_V3)
            if raw_v3:
                parsed = self._parse_rates_payload(raw_v3, 'Finans API v3 (fallback)')
                if parsed:
                    return parsed
                logger.warning("Finans API v3 de geçersiz/boş")

            return None
        except Exception as e:
            logger.error("Finans API servisi hatası: %s", e)
            return None
    
    def get_formatted_rates(self) -> Optional[Dict[str, Any]]:
        """
        Finans API verilerini formatlanmış şekilde döndürür.
        Frontend'de kullanım için uygun formatta.
        """
        data = self.get_exchange_rates()
        
        if not data:
            return None
        
        # Format the data for frontend consumption
        formatted = {
            'exchange_rates': {},
            'gold_prices': {},
            'crypto_currencies': {},
            'precious_metals': {},
            'parities': {},
            'last_updated': data.get('timestamp'),
            'date': data.get('date'),
            'date_en': data.get('date_en'),
            'source': data.get('source', 'Finans API'),
            'fetch_time': data.get('fetch_time'),
        }
        
        # Format currencies
        for code, rates in data.get('currencies', {}).items():
            formatted['exchange_rates'][code] = {
                'code': rates.get('code', code),
                'name': rates.get('name', code),
                'name_tr': rates.get('name_tr', ''),
                'rate': rates.get('rate', 0),
                'buy': rates.get('buy', 0),
                'sell': rates.get('sell', 0),
                'change': rates.get('change', 0),
                'type': 'currency'
            }
        
        # Format gold prices
        for code, gold in data.get('gold_prices', {}).items():
            formatted['gold_prices'][code] = {
                'code': code,
                'name': gold.get('name', code),
                'name_tr': gold.get('name_tr', code),
                'rate': gold.get('rate', 0),
                'buy': gold.get('buy', 0),
                'sell': gold.get('sell', 0),
                'change': gold.get('change', 0),
                'type': 'gold'
            }
        
        # Format crypto currencies
        for code, crypto in data.get('crypto_currencies', {}).items():
            formatted['crypto_currencies'][code] = {
                'code': code,
                'name': crypto.get('name', code),
                'name_tr': crypto.get('name_tr', code),
                'rate': crypto.get('rate', 0),
                'buy': crypto.get('buy', 0),
                'sell': crypto.get('sell', 0),
                'usd_price': crypto.get('usd_price', 0),
                'change': crypto.get('change', 0),
                'type': 'crypto'
            }
        
        # Format precious metals
        for code, metal in data.get('precious_metals', {}).items():
            formatted['precious_metals'][code] = {
                'code': code,
                'name': metal.get('name', code),
                'name_tr': metal.get('name_tr', code),
                'rate': metal.get('rate', 0),
                'buy': metal.get('buy', 0),
                'sell': metal.get('sell', 0),
                'change': metal.get('change', 0),
                'type': metal.get('type', 'precious_metal')
            }
        
        return formatted
    


# Singleton instance
_tcmb_service = None

def get_tcmb_service() -> TCMBService:
    """TCMB servisinin singleton instance'ını döndür"""
    global _tcmb_service
    if _tcmb_service is None:
        _tcmb_service = TCMBService()
    return _tcmb_service
