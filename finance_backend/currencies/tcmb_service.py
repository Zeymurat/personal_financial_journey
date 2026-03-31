"""
Finans API (finans.truncgil.com) Döviz Kurları Servisi
https://finans.truncgil.com/v4/today.json
"""
import logging
from typing import Dict, Any, Optional
import requests
from datetime import datetime, time
import json

logger = logging.getLogger(__name__)

# Finans API Endpoint
FINANS_API_URL = "https://finans.truncgil.com/v4/today.json"

# Zamanlama kontrolü için saatler (Döviz kurları güncelleme saatleri)
# Borsa ile aynı saatler: 10:00, 13:30, 17:00
FETCH_TIMES = [
    time(10, 0),   # 10:00 - İlk seans başlangıcı
    time(13, 30),  # 13:30 - Öğle arası sonrası
    time(17, 0),   # 17:00 - İkinci seans sonu
]


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
    
    def get_exchange_rates(self) -> Optional[Dict[str, Any]]:
        """
        Finans API'den güncel döviz kurlarını, altın fiyatlarını ve kripto paraları alır.
        
        Returns:
            Dict containing currency rates, gold prices, and crypto currencies
            None if error occurs
        """
        try:
            # Finans API'yi çağır
            response = self.session.get(
                FINANS_API_URL,
                timeout=60,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Connection': 'keep-alive'
                },
                stream=False
            )
            
            if response.status_code != 200:
                logger.error(f"Finans API HTTP Hatası: {response.status_code}")
                return None
            
            # Response'un tam olup olmadığını kontrol et
            content_length = response.headers.get('Content-Length')
            actual_length = len(response.content)
            response_text = response.text
            
            # JSON'un kesilmiş olup olmadığını kontrol et
            is_truncated = False
            if response_text:
                # JSON'un sonunda } olmalı, eğer yoksa kesilmiş olabilir
                response_text_stripped = response_text.strip()
                if not response_text_stripped.endswith('}'):
                    is_truncated = True
                # Veya Content-Length kontrolü
                if content_length and int(content_length) > actual_length:
                    is_truncated = True
            
            # JSON'u parse et
            try:
                data = response.json()
            except (json.JSONDecodeError, ValueError) as json_error:
                # Response kesilmişse, cache'den veri okunacak
                if is_truncated:
                    logger.warning(
                        f"💱 Finans API response kesilmiş (uzunluk: {actual_length} bytes). "
                        f"Cache'den veri okunacak."
                    )
                    return None
                else:
                    # Alternatif: response.content ile dene
                    try:
                        import codecs
                        decoded_content = codecs.decode(response.content, 'utf-8', errors='ignore')
                        data = json.loads(decoded_content)
                    except Exception:
                        logger.warning(
                            f"💱 Finans API JSON parse hatası. "
                            f"Cache'den veri okunacak."
                        )
                        return None
            except Exception as parse_error:
                logger.warning(
                    f"💱 Finans API parse hatası. "
                    f"Cache'den veri okunacak."
                )
                return None
            
            # Update_Date'i al
            update_date = data.get('Update_Date', '')
            
            result = {
                'currencies': {},
                'gold_prices': {},
                'crypto_currencies': {},
                'precious_metals': {},  # Platinum, Palladium
                'timestamp': datetime.now().isoformat(),
                'fetch_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'source': 'Finans API',
                'update_date': update_date
            }
            
            currency_count = 0
            gold_count = 0
            crypto_count = 0
            metal_count = 0
            
            # Her item'ı işle
            for code, item_data in data.items():
                # Update_Date'i atla
                if code == 'Update_Date':
                    continue
                
                # Dict değilse atla
                if not isinstance(item_data, dict):
                    continue
                
                item_type = item_data.get('Type', '')
                name = item_data.get('Name', code)
                change = item_data.get('Change', 0)
                
                # Currency (Döviz Kurları)
                if item_type == 'Currency':
                    buying = item_data.get('Buying', 0)
                    selling = item_data.get('Selling', 0)
                    
                    # Ortalama kur (buying ve selling ortalaması)
                    avg_rate = (buying + selling) / 2 if (buying > 0 and selling > 0) else (buying if buying > 0 else selling)
                    
                    result['currencies'][code] = {
                        'code': code,
                        'name': name,  # API'den gelen Türkçe isim
                        'name_tr': name,
                        'rate': avg_rate,
                        'buy': float(buying) if buying else 0,
                        'sell': float(selling) if selling else 0,
                        'change': float(change) if change else 0,
                        'type': 'currency'
                    }
                    currency_count += 1
                
                # Gold (Altın Fiyatları)
                elif item_type == 'Gold':
                    buying = item_data.get('Buying', 0)
                    selling = item_data.get('Selling', 0)
                    
                    # Eğer sadece Selling varsa, Buying = Selling (örn: XU100, ONS, BRENT)
                    if buying == 0 and selling > 0:
                        buying = selling
                    elif selling == 0 and buying > 0:
                        selling = buying
                    
                    # Ortalama fiyat
                    avg_price = (buying + selling) / 2 if (buying > 0 and selling > 0) else (buying if buying > 0 else selling)
                    
                    result['gold_prices'][code] = {
                        'code': code,
                        'name': name,
                        'name_tr': name,
                        'rate': avg_price,
                        'buy': float(buying) if buying else 0,
                        'sell': float(selling) if selling else 0,
                        'change': float(change) if change else 0,
                        'type': 'gold'
                    }
                    gold_count += 1
                
                # CryptoCurrency (Kripto Paralar)
                elif item_type == 'CryptoCurrency':
                    usd_price = item_data.get('USD_Price', 0)
                    try_price = item_data.get('TRY_Price', 0)
                    selling = item_data.get('Selling', try_price)  # TRY_Price genelde Selling ile aynı
                    
                    # TRY_Price yoksa Selling'i kullan
                    if try_price == 0 and selling > 0:
                        try_price = selling
                    
                    result['crypto_currencies'][code] = {
                        'code': code,
                        'name': name,
                        'name_tr': name,
                        'rate': float(try_price) if try_price else 0,
                        'buy': float(try_price) if try_price else 0,  # Kripto için genelde buy/sell aynı
                        'sell': float(selling) if selling else float(try_price) if try_price else 0,
                        'usd_price': float(usd_price) if usd_price else 0,
                        'change': float(change) if change else 0,
                        'type': 'crypto'
                    }
                    crypto_count += 1
                
                # Platinum (Platin)
                elif item_type == 'Platinum':
                    buying = item_data.get('Buying', 0)
                    selling = item_data.get('Selling', 0)
                    avg_price = (buying + selling) / 2 if (buying > 0 and selling > 0) else (buying if buying > 0 else selling)
                    
                    result['precious_metals'][code] = {
                        'code': code,
                        'name': name,
                        'name_tr': name,
                        'rate': avg_price,
                        'buy': float(buying) if buying else 0,
                        'sell': float(selling) if selling else 0,
                        'change': float(change) if change else 0,
                        'type': 'platinum'
                    }
                    metal_count += 1
                
                # Palladium (Paladyum)
                elif item_type == 'Palladium':
                    buying = item_data.get('Buying', 0)
                    selling = item_data.get('Selling', 0)
                    avg_price = (buying + selling) / 2 if (buying > 0 and selling > 0) else (buying if buying > 0 else selling)
                    
                    result['precious_metals'][code] = {
                        'code': code,
                        'name': name,
                        'name_tr': name,
                        'rate': avg_price,
                        'buy': float(buying) if buying else 0,
                        'sell': float(selling) if selling else 0,
                        'change': float(change) if change else 0,
                        'type': 'palladium'
                    }
                    metal_count += 1
            
            # TRY'yi ekle (base currency)
            result['currencies']['TRY'] = {
                'code': 'TRY',
                'name': 'Turkish Lira',
                'name_tr': 'TÜRK LİRASI',
                'rate': 1,
                'buy': 1,
                'sell': 1,
                'change': 0,
                'type': 'currency'
            }
            
            result['date'] = update_date.split(' ')[0] if update_date else ''
            result['date_en'] = update_date
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Finans API JSON parse hatası: {e}")
            return None
        except Exception as e:
            logger.error(f"Finans API servisi hatası: {e}")
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
            'date_en': data.get('date_en')
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
