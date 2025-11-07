"""
CollectAPI Borsa (Hisse Senedi) Servisi
https://api.collectapi.com/economy/hisseSenedi
"""
import logging
import os
from typing import Dict, Any, Optional, List
import requests
from datetime import datetime, time
import json
from pathlib import Path

logger = logging.getLogger(__name__)

# Lokal backup dosyası dizini
BACKUP_DIR = Path(__file__).parent.parent / 'data' / 'borsa_backups'
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

# CollectAPI Endpoint
COLLECTAPI_BORSA_URL = "https://api.collectapi.com/economy/hisseSenedi"

# Zamanlama kontrolü için saatler (Borsa İstanbul çalışma saatleri)
FETCH_TIMES = [
    time(10, 0),   # 10:00 - İlk seans başlangıcı
    time(13, 30),  # 13:30 - Öğle arası sonrası
    time(17, 0),   # 17:00 - İkinci seans sonu
]


class BorsaService:
    """CollectAPI'den borsa verilerini çeken servis sınıfı"""
    
    def __init__(self):
        self.session = requests.Session()
        # CollectAPI API Key - Environment variable'dan al
        self.api_key = os.getenv('COLLECTAPI_KEY', '')
        if not self.api_key:
            logger.warning("COLLECTAPI_KEY environment variable bulunamadı!")
    
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
        print(f"🔍 BORSA: Saat Mantığı Kontrolü")
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
                logger.warning(f"fetch_time parse hatası: {e}")
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
    
    def get_borsa_data(self) -> Optional[Dict[str, Any]]:
        """
        CollectAPI'den borsa verilerini alır.
        
        Returns:
            Dict containing stock market data
            None if error occurs
        """
        if not self.api_key:
            logger.error("CollectAPI API Key bulunamadı!")
            return None
        
        try:
            print("=" * 60)
            print("📈 Borsa Servisi - Veri çekiliyor...")
            print("=" * 60)
            
            print(f"📤 CollectAPI Borsa API çağrılıyor: {COLLECTAPI_BORSA_URL}")
            
            # CollectAPI'yi çağır
            # CollectAPI header formatı: "apikey {key}"
            response = self.session.get(
                COLLECTAPI_BORSA_URL,
                timeout=30,
                headers={
                    'Authorization': f'apikey {self.api_key}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'FinanceApp/1.0'
                }
            )
            
            print(f"📥 Response Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ HTTP Hatası: {response.status_code}")
                print(f"Response: {response.text[:200]}")
                logger.error(f"CollectAPI HTTP Hatası: {response.status_code}")
                return None
            
            # JSON'u parse et
            print("📊 JSON response parse ediliyor...")
            data = response.json()
            
            # CollectAPI response formatı kontrolü
            if not isinstance(data, dict):
                logger.error("CollectAPI response beklenen formatta değil")
                return None
            
            # Başarılı response kontrolü
            if data.get('success') == False:
                error_msg = data.get('message', 'Bilinmeyen hata')
                print(f"❌ CollectAPI hatası: {error_msg}")
                logger.error(f"CollectAPI hatası: {error_msg}")
                return None
            
            # result içindeki verileri al
            result_data = data.get('result', [])
            
            if not result_data:
                print("⚠️ CollectAPI'den veri gelmedi")
                logger.warning("CollectAPI'den boş veri döndü")
                return None
            
            # Veriyi formatla
            formatted_data = {
                'stocks': [],
                'timestamp': datetime.now().isoformat(),
                'fetch_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'source': 'CollectAPI',
                'total_count': len(result_data)
            }
            
            # Her hisse senedi verisini işle
            # CollectAPI formatı:
            # - rate: Değişim oranı (örn: -0.59)
            # - lastprice: Son fiyat (örn: 36.98)
            # - lastpricestr: Son fiyat string (örn: "36,98")
            # - hacim: Hacim (örn: 1540083350.86)
            # - hacimstr: Hacim string (örn: "₺1.540.083.350,86")
            # - min: Minimum fiyat (örn: 36.8)
            # - minstr: Minimum fiyat string (örn: "36,80")
            # - max: Maksimum fiyat (örn: 37.52)
            # - maxstr: Maksimum fiyat string (örn: "37,52")
            # - time: Zaman (örn: "18:10")
            # - text: İsim (örn: "SISE CAM")
            # - code: Kod (örn: "SISE")
            # - icon: İkon URL'si
            for stock in result_data:
                if not isinstance(stock, dict):
                    continue
                
                formatted_stock = {
                    'code': stock.get('code', ''),
                    'name': stock.get('text', ''),
                    'last_price': self._parse_price(stock.get('lastprice', 0)),
                    'last_price_str': stock.get('lastpricestr', ''),
                    'rate': self._parse_price(stock.get('rate', 0)),  # Değişim oranı
                    'volume': self._parse_volume(stock.get('hacim', 0)),  # hacim field'ı
                    'volume_str': stock.get('hacimstr', ''),
                    'high': self._parse_price(stock.get('max', 0)),  # max field'ı
                    'high_str': stock.get('maxstr', ''),
                    'low': self._parse_price(stock.get('min', 0)),  # min field'ı
                    'low_str': stock.get('minstr', ''),
                    'time': stock.get('time', ''),
                    'icon': stock.get('icon', '')
                }
                
                formatted_data['stocks'].append(formatted_stock)
            
            print(f"✅ Parse başarılı. Hisse senetleri: {len(formatted_data['stocks'])} adet")
            print("=" * 60)
            return formatted_data
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse hatası: {e}")
            print("=" * 60)
            logger.error(f"CollectAPI JSON parse hatası: {e}")
            return None
        except Exception as e:
            print(f"❌ Borsa servisi hatası: {e}")
            print("=" * 60)
            logger.error(f"Borsa servisi hatası: {e}")
            return None
    
    def _parse_price(self, value: Any) -> float:
        """Fiyat değerini float'a çevirir"""
        try:
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                # Türkçe format: "36,98" -> 36.98 veya "36.80" -> 36.80
                # Virgülü noktaya çevir, binlik ayırıcı noktaları kaldır
                cleaned = value.replace('.', '').replace(',', '.').strip()
                return float(cleaned) if cleaned else 0.0
            return 0.0
        except (ValueError, TypeError):
            return 0.0
    
    def _parse_number(self, value: Any) -> int:
        """Sayısal değeri int'e çevirir"""
        try:
            if isinstance(value, (int, float)):
                return int(value)
            if isinstance(value, str):
                # Virgül ve nokta işaretlerini temizle
                cleaned = value.replace(',', '').replace('.', '').strip()
                return int(float(cleaned)) if cleaned else 0
            return 0
        except (ValueError, TypeError):
            return 0
    
    def _parse_volume(self, value: Any) -> float:
        """Hacim değerini float'a çevirir (büyük sayılar için)"""
        try:
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                # Türkçe format: "₺1.540.083.350,86" -> 1540083350.86
                # Önce ₺, nokta ve virgül temizle
                cleaned = value.replace('₺', '').replace('.', '').replace(',', '.').strip()
                return float(cleaned) if cleaned else 0.0
            return 0.0
        except (ValueError, TypeError):
            return 0.0
    
    def save_to_local_file(self, data: Dict[str, Any]) -> Optional[str]:
        """
        Borsa verilerini lokal dosyaya kaydeder.
        
        Args:
            data: Kaydedilecek borsa verisi
            
        Returns:
            Kaydedilen dosya path'i veya None
        """
        try:
            today = datetime.now().strftime('%Y-%m-%d')
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Dosya adı: borsa_YYYY-MM-DD_HHMMSS.json
            filename = f'borsa_{today}_{timestamp}.json'
            filepath = BACKUP_DIR / filename
            
            # Veriyi JSON olarak kaydet
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"💾 Lokal dosyaya kaydedildi: {filepath}")
            logger.info(f"Borsa verisi lokal dosyaya kaydedildi: {filepath}")
            
            return str(filepath)
            
        except Exception as e:
            print(f"❌ Lokal dosyaya kaydetme hatası: {e}")
            logger.error(f"Lokal dosyaya kaydetme hatası: {e}")
            return None
    
    def load_from_local_file(self, date: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Lokal dosyadan borsa verilerini yükler.
        
        Args:
            date: Tarih (YYYY-MM-DD formatında). Yoksa en son kaydedilen dosya
            
        Returns:
            Yüklenen veri veya None
        """
        try:
            if date:
                # Belirli bir tarih için dosya ara
                pattern = f'borsa_{date}_*.json'
                files = list(BACKUP_DIR.glob(pattern))
                if not files:
                    print(f"⚠️ {date} tarihine ait lokal dosya bulunamadı")
                    return None
                # En son kaydedileni al
                filepath = max(files, key=lambda p: p.stat().st_mtime)
            else:
                # En son kaydedilen dosyayı bul
                files = list(BACKUP_DIR.glob('borsa_*.json'))
                if not files:
                    print("⚠️ Lokal backup dosyası bulunamadı")
                    return None
                filepath = max(files, key=lambda p: p.stat().st_mtime)
            
            # Dosyayı oku
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"📂 Lokal dosyadan yüklendi: {filepath}")
            logger.info(f"Borsa verisi lokal dosyadan yüklendi: {filepath}")
            
            return data
            
        except Exception as e:
            print(f"❌ Lokal dosyadan yükleme hatası: {e}")
            logger.error(f"Lokal dosyadan yükleme hatası: {e}")
            return None


# Singleton instance
_borsa_service = None

def get_borsa_service() -> BorsaService:
    """Borsa servisinin singleton instance'ını döndür"""
    global _borsa_service
    if _borsa_service is None:
        _borsa_service = BorsaService()
    return _borsa_service

