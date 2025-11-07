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
        
        Mantık:
        1. Bugün için veri yoksa:
           - Saat >= 10:00 ise → Veri çek
           - Saat < 10:00 ise → Veri çekme
        
        2. Bugün için veri varsa:
           - Son çekim 10:00-13:30 arasındaysa:
             * Saat >= 14:00 ise → Veri çek (13:30'u kaçırdık)
             * Saat < 14:00 ise → Veri çekme
           - Son çekim 13:30-17:00 arasındaysa:
             * Saat >= 17:00 ise → Veri çek (17:00'ü kaçırdık)
             * Saat < 17:00 ise → Veri çekme
           - Son çekim 17:00'den sonraysa:
             * Bugün için veri çekme (günün son verisi zaten çekilmiş)
        
        Args:
            existing_fetch_time: Firestore'dan gelen fetch_time (örn: "2025-11-05 10:23:46")
        
        Returns:
            True if new data should be fetched, False otherwise
        """
        now = datetime.now()
        today = now.strftime('%Y-%m-%d')
        current_time = now.time()
        current_minutes = current_time.hour * 60 + current_time.minute
        
        print(f"\n{'='*60}")
        print(f"🔍 DÖVİZ: Saat Mantığı Kontrolü")
        print(f"{'='*60}")
        print(f"📅 Bugün: {today}")
        print(f"⏰ Şu anki saat: {current_time} ({current_minutes} dakika)")
        print(f"📋 Fetch saatleri: 10:00 (600dk), 13:30 (810dk), 17:00 (1020dk)")
        print(f"📋 Kontrol saatleri: 10:00, 14:00 (13:30'u kaçırdık mı?), 17:00")
        print(f"📝 Son fetch: {existing_fetch_time or 'Yok'}")
        
        # Hafta sonu kontrolü
        if not self.is_weekday():
            print(f"📅 Hafta sonu kontrolü: Hafta sonu, VERİ ÇEKİLMEYECEK")
            print(f"{'='*60}\n")
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
            except Exception as e:
                print(f"         - fetch_time parse hatası: {e}")
                existing_fetch_time = None
        
        # Durum 1: Bugün için veri yok
        if not existing_fetch_time or (fetch_date and fetch_date != today):
            print(f"📊 DURUM 1: Bugün için veri YOK")
            print(f"   - Son fetch tarihi: {fetch_date or 'Yok'}")
            print(f"   - Bugün: {today}")
            print(f"   - Mantık: Saat >= 10:00 ise → Veri çek")
            print(f"   - Kontrol: {current_minutes}dk >= {FETCH_10_00}dk?")
            
            # Saat >= 10:00 ise → Veri çek
            if current_minutes >= FETCH_10_00:
                print(f"   ✅ SONUÇ: Saat 10:00'u geçtik ({current_time}), VERİ ÇEKİLECEK")
                print(f"{'='*60}\n")
                return True
            else:
                print(f"   ❌ SONUÇ: Saat 10:00'a henüz gelmedik ({current_time}), VERİ ÇEKİLMEYECEK")
                print(f"{'='*60}\n")
                return False
        
        # Durum 2: Bugün için veri var
        if fetch_time_minutes is None:
            # Parse edilemedi, güvenli tarafta kal
            print(f"📊 DURUM 2: Bugün için veri VAR ama parse edilemedi")
            print(f"   ❌ SONUÇ: Parse hatası, VERİ ÇEKİLMEYECEK")
            print(f"{'='*60}\n")
            return False
        
        print(f"📊 DURUM 2: Bugün için veri VAR")
        print(f"   - Son çekim saati: {fetch_time_minutes} dakika ({fetch_time_minutes // 60}:{fetch_time_minutes % 60:02d})")
        print(f"   - Şu anki saat: {current_minutes} dakika ({current_time})")
        
        # Son çekim saati hangi aralıkta?
        if FETCH_10_00 <= fetch_time_minutes < FETCH_13_30:
            # Son çekim 10:00-13:30 arasındaysa
            print(f"   - Son çekim ARALIĞI: 10:00-13:30 arasında")
            print(f"   - Mantık: Saat >= 14:00 ise → Veri çek (13:30'u kaçırdık mı?)")
            print(f"   - Kontrol: {current_minutes}dk >= {FETCH_14_00}dk?")
            
            # Saat >= 14:00 ise → Veri çek (13:30'u kaçırdık)
            if current_minutes >= FETCH_14_00:
                print(f"   ✅ SONUÇ: Saat 14:00'u geçtik ({current_time}), 13:30'u kaçırdık, VERİ ÇEKİLECEK")
                print(f"{'='*60}\n")
                return True
            else:
                print(f"   ❌ SONUÇ: Saat 14:00'a henüz gelmedik ({current_time}), VERİ ÇEKİLMEYECEK")
                print(f"{'='*60}\n")
                return False
        
        elif FETCH_13_30 <= fetch_time_minutes < FETCH_17_00:
            # Son çekim 13:30-17:00 arasındaysa
            print(f"   - Son çekim ARALIĞI: 13:30-17:00 arasında")
            print(f"   - Mantık: Saat >= 17:00 ise → Veri çek (17:00'ü kaçırdık mı?)")
            print(f"   - Kontrol: {current_minutes}dk >= {FETCH_17_00}dk?")
            
            # Saat >= 17:00 ise → Veri çek (17:00'ü kaçırdık)
            if current_minutes >= FETCH_17_00:
                print(f"   ✅ SONUÇ: Saat 17:00'u geçtik ({current_time}), VERİ ÇEKİLECEK")
                print(f"{'='*60}\n")
                return True
            else:
                print(f"   ❌ SONUÇ: Saat 17:00'a henüz gelmedik ({current_time}), VERİ ÇEKİLMEYECEK")
                print(f"{'='*60}\n")
                return False
        
        elif fetch_time_minutes >= FETCH_17_00:
            # Son çekim 17:00'den sonraysa
            print(f"   - Son çekim ARALIĞI: 17:00'den sonra")
            print(f"   - Mantık: Günün son verisi zaten çekilmiş")
            print(f"   ❌ SONUÇ: Günün son verisi zaten çekilmiş, VERİ ÇEKİLMEYECEK")
            print(f"{'='*60}\n")
            return False
        
        else:
            # Son çekim 10:00'dan önceyse (normalde olmaz ama güvenlik için)
            print(f"   - Son çekim ARALIĞI: 10:00'dan önce (beklenmedik)")
            print(f"   ✅ SONUÇ: Beklenmedik durum, VERİ ÇEKİLECEK")
            print(f"{'='*60}\n")
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
            print("=" * 60)
            print("💰 Finans API Servisi - Tüm veriler çekiliyor...")
            print("=" * 60)
            
            print(f"📤 Finans JSON API çağrılıyor: {FINANS_API_URL}")
            
            # Finans API'yi çağır
            # Accept-Encoding'i kaldırdık - gzip sorunlarına yol açabilir
            response = self.session.get(
                FINANS_API_URL,
                timeout=60,  # Timeout'u artırdık (30 -> 60)
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Connection': 'keep-alive'
                },
                stream=False  # Stream mode'u kapattık
            )
            
            print(f"📥 Response Status: {response.status_code}")
            print(f"📄 Content-Type: {response.headers.get('Content-Type', 'N/A')}")
            print(f"📏 Content-Length: {response.headers.get('Content-Length', 'N/A')}")
            
            if response.status_code != 200:
                print(f"❌ HTTP Hatası: {response.status_code}")
                print(f"Response: {response.text[:200]}")
                logger.error(f"Finans API HTTP Hatası: {response.status_code}")
                return None
            
            # Response içeriğini kontrol et
            try:
                response_text = response.text
                response_length = len(response_text)
                print(f"📏 Response uzunluğu: {response_length} karakter")
                
                # Response'un sonunu kontrol et - JSON tamamlanmış mı?
                if response_length > 0:
                    last_chars = response_text[-100:] if response_length > 100 else response_text
                    print(f"📄 Response sonu (son 100 karakter): {last_chars}")
                    
                    # JSON'un düzgün kapanıp kapanmadığını kontrol et
                    if not response_text.strip().endswith('}'):
                        print(f"⚠️ UYARI: Response JSON formatında bitmiyor! Son karakter: '{response_text[-1] if response_text else 'N/A'}'")
            except Exception as text_error:
                print(f"⚠️ Response text okuma hatası: {text_error}")
                response_text = ""
                response_length = 0
            
            # JSON'u parse et
            print("📊 JSON response parse ediliyor...")
            try:
                # Önce response.text'i kullan, eğer sorun olursa response.content'i dene
                data = response.json()
            except json.JSONDecodeError as json_error:
                print(f"❌ Finans API JSON parse hatası: {json_error}")
                print(f"   Hata pozisyonu: {getattr(json_error, 'pos', 'N/A')}")
                print(f"   Hata satırı: {getattr(json_error, 'lineno', 'N/A')}")
                print(f"   Hata kolonu: {getattr(json_error, 'colno', 'N/A')}")
                
                if response_length > 0:
                    print(f"📄 Response başlangıcı (ilk 500 karakter):")
                    print(response_text[:500])
                    print(f"📄 Response sonu (son 500 karakter):")
                    print(response_text[-500:] if response_length > 500 else response_text)
                    
                    # Hata pozisyonuna göre çevresini göster
                    if hasattr(json_error, 'pos') and json_error.pos:
                        error_pos = json_error.pos
                        start = max(0, error_pos - 100)
                        end = min(response_length, error_pos + 100)
                        print(f"📄 Hata pozisyonu çevresi ({start}-{end}):")
                        print(response_text[start:end])
                
                # Alternatif: response.content ile dene
                try:
                    print("🔄 Alternatif: response.content ile parse deneniyor...")
                    import codecs
                    decoded_content = codecs.decode(response.content, 'utf-8', errors='ignore')
                    data = json.loads(decoded_content)
                    print("✅ Alternatif yöntem başarılı!")
                except Exception as alt_error:
                    print(f"❌ Alternatif yöntem de başarısız: {alt_error}")
                    logger.error(f"Finans API JSON parse hatası: {json_error}", exc_info=True)
                    return None
            except Exception as parse_error:
                print(f"❌ Finans API parse hatası: {parse_error}")
                print(f"📄 Response başlangıcı (ilk 500 karakter):")
                if response_length > 0:
                    print(response_text[:500])
                logger.error(f"Finans API parse hatası: {parse_error}", exc_info=True)
                return None
            
            # Update_Date'i al
            update_date = data.get('Update_Date', '')
            print(f"📅 Finans API Güncelleme Tarihi: {update_date}")
            
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
            
            print(f"✅ Parse başarılı!")
            print(f"   - Döviz kurları: {currency_count} adet")
            print(f"   - Altın fiyatları: {gold_count} adet")
            print(f"   - Kripto paralar: {crypto_count} adet")
            print(f"   - Değerli metaller (Platin/Paladyum): {metal_count} adet")
            print("=" * 60)
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse hatası: {e}")
            print("=" * 60)
            logger.error(f"Finans API JSON parse hatası: {e}")
            return None
        except Exception as e:
            print(f"❌ Finans API servisi hatası: {e}")
            print("=" * 60)
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
