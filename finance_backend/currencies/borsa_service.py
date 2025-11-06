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
        
        Args:
            existing_fetch_time: Firestore'dan gelen fetch_time (örn: "2025-11-05 10:23:46")
        
        Returns:
            True if new data should be fetched, False otherwise
        """
        now = datetime.now()
        today = now.strftime('%Y-%m-%d')
        current_time = now.time()
        
        # Hafta sonu kontrolü
        if not self.is_weekday():
            return False
        
        # Eğer bugün için veri yoksa, saat uygunsa çek
        if not existing_fetch_time:
            return self.should_fetch_data()
        
        # Mevcut fetch_time'ı parse et
        try:
            # fetch_time formatı: "2025-11-05 10:23:46" veya "10:23:46"
            if ' ' in existing_fetch_time:
                fetch_datetime_str = existing_fetch_time.split(' ')[1]  # "10:23:46"
            else:
                fetch_datetime_str = existing_fetch_time  # "10:23:46"
            
            # Saat ve dakikayı al (saniyeyi atla)
            time_parts = fetch_datetime_str.split(':')
            fetch_hour = int(time_parts[0])
            fetch_minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            fetch_time_obj = time(fetch_hour, fetch_minute)
            
            # Hangi fetch saatinde çekilmiş?
            fetch_index = None
            for i, ft in enumerate(FETCH_TIMES):
                time_diff = abs(
                    (fetch_time_obj.hour * 60 + fetch_time_obj.minute) - 
                    (ft.hour * 60 + ft.minute)
                )
                if time_diff <= 5:  # 5 dakika tolerans
                    fetch_index = i
                    break
            
            # Eğer fetch_time belirtilen saatlerden birine uymuyorsa
            if fetch_index is None:
                fetch_minutes = fetch_time_obj.hour * 60 + fetch_time_obj.minute
                current_minutes = current_time.hour * 60 + current_time.minute
                first_fetch_minutes = FETCH_TIMES[0].hour * 60 + FETCH_TIMES[0].minute
                
                # Eğer son çekim ilk fetch saatinden önce yapılmışsa
                # ve şu anki saat ilk fetch saatinden sonraysa → Yeni veri çek
                if fetch_minutes < first_fetch_minutes:
                    if current_minutes >= first_fetch_minutes - 5:  # 5 dakika önce başlayabilir
                        return True
                    else:
                        return False
                
                # Eğer son çekim ilk fetch saatinden sonra ama FETCH_TIMES'ten hiçbirine uymuyorsa
                # (örneğin 11:15, 11:59 gibi bir saatte çekilmişse)
                # Bir sonraki fetch saatini bul ve kontrol et
                
                # Hangi fetch saatlerinden sonra çekilmiş?
                next_fetch_index = None
                for i, ft in enumerate(FETCH_TIMES):
                    fetch_time_minutes = ft.hour * 60 + ft.minute
                    if fetch_minutes < fetch_time_minutes:
                        # Bu fetch saatinden önce çekilmiş, yani bir önceki fetch saati geçmiş
                        next_fetch_index = i
                        break
                
                if next_fetch_index is not None:
                    # Bir sonraki fetch saati bulundu
                    next_fetch_time = FETCH_TIMES[next_fetch_index]
                    next_fetch_minutes = next_fetch_time.hour * 60 + next_fetch_time.minute
                    
                    # Şu anki saat bir sonraki fetch saatine gelmiş mi?
                    if current_minutes >= next_fetch_minutes - 5:  # 5 dakika önce başlayabilir
                        return True
                    else:
                        return False
                else:
                    # Son fetch saatinden sonra çekilmiş (17:00'den sonra)
                    # Bugün için yeni veri çekme
                    return False
            
            # Bir sonraki fetch saatine gelmiş mi?
            # Eğer son fetch 10:00'da yapıldıysa ve şimdi 13:30'a gelmişse → True
            # Eğer son fetch 13:30'da yapıldıysa ve şimdi 17:00'a gelmişse → True
            # Eğer son fetch 17:00'da yapıldıysa → False (bugün için son)
            
            if fetch_index < len(FETCH_TIMES) - 1:
                # Bir sonraki fetch saati var
                next_fetch_time = FETCH_TIMES[fetch_index + 1]
                current_minutes = current_time.hour * 60 + current_time.minute
                next_fetch_minutes = next_fetch_time.hour * 60 + next_fetch_time.minute
                
                # Şu anki saat bir sonraki fetch saatine gelmiş mi?
                if current_minutes >= next_fetch_minutes - 5:  # 5 dakika önce başlayabilir
                    return True
            
            # Son fetch saatindeyse (17:00), bugün için yeni veri çekme
            return False
            
        except (ValueError, IndexError) as e:
            # Parse hatası, güvenli tarafta kal ve yeni veri çek
            logger.warning(f"fetch_time parse hatası: {e}, yeni veri çekilecek")
            return self.should_fetch_data()
    
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

