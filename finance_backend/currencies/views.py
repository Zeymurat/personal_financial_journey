"""
Döviz kurları için API View'ları (Finans API - finans.truncgil.com)
Borsa verileri için API View'ları (CollectAPI)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from firebase_admin import firestore
from datetime import datetime, timedelta
import logging
import json
import os
from pathlib import Path
import requests

from .tcmb_service import get_tcmb_service
from .borsa_service import get_borsa_service

logger = logging.getLogger(__name__)


# ============================================================================
# Local Dosya Helper Fonksiyonları
# ============================================================================

def get_json_file_path(filename: str) -> str:
    """
    JSON dosyasının yolunu bulur.
    funds.json ile TAM AYNI dizine yazar/okur.
    
    Args:
        filename: Dosya adı (örn: 'currencies.json', 'borsa.json')
    
    Returns:
        Dosyanın tam yolu (funds.json ile aynı dizinde)
    """
    # funds.json'ın tam yolunu bul (FundsListView ile aynı mantık)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    funds_json_path = os.path.join(current_dir, 'funds.json')
    
    # Eğer funds.json bulunamazsa, proje kök dizininde ara
    if not os.path.exists(funds_json_path):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
        funds_json_path = os.path.join(base_dir, 'funds.json')
    
    # funds.json'ın dizinini al (funds.json ile aynı dizin)
    funds_dir = os.path.dirname(funds_json_path)
    
    # Yeni dosyanın yolunu funds.json ile aynı dizinde oluştur
    file_path = os.path.join(funds_dir, filename)
    
    return file_path


def read_currencies_from_file() -> dict:
    """
    currencies.json dosyasından döviz kurlarını okur.
    
    Returns:
        {
            'exchange_rates': {...},
            'gold_prices': {...},
            'crypto_currencies': {...},
            'precious_metals': {...},
            'metadata': {...}
        }
    """
    file_path = get_json_file_path('currencies.json')
    
    if not os.path.exists(file_path):
        print(f"⚠️ currencies.json dosyası bulunamadı: {file_path}")
        return {
            'exchange_rates': {},
            'gold_prices': {},
            'crypto_currencies': {},
            'precious_metals': {},
            'metadata': {}
        }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"✅ currencies.json dosyası okundu: {file_path}")
        return data
    except json.JSONDecodeError as e:
        print(f"❌ currencies.json parse hatası: {e}")
        return {
            'exchange_rates': {},
            'gold_prices': {},
            'crypto_currencies': {},
            'precious_metals': {},
            'metadata': {}
        }
    except Exception as e:
        print(f"❌ currencies.json okuma hatası: {e}")
        return {
            'exchange_rates': {},
            'gold_prices': {},
            'crypto_currencies': {},
            'precious_metals': {},
            'metadata': {}
        }


def write_currencies_to_file(data: dict) -> bool:
    """
    Döviz kurlarını currencies.json dosyasına yazar.
    funds.json ile TAM AYNI dizine yazar.
    
    Args:
        data: {
            'exchange_rates': {...},
            'gold_prices': {...},
            'crypto_currencies': {...},
            'precious_metals': {...},
            'metadata': {...}
        }
    
    Returns:
        True if successful, False otherwise
    """
    file_path = get_json_file_path('currencies.json')
    
    # funds.json'ın dizinini kullan (zaten var olmalı)
    file_dir = os.path.dirname(file_path)
    if file_dir and not os.path.exists(file_dir):
        os.makedirs(file_dir, exist_ok=True)
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ currencies.json dosyasına yazıldı: {file_path} (funds.json ile aynı dizinde: {os.path.dirname(file_path)})")
        return True
    except Exception as e:
        print(f"❌ currencies.json yazma hatası: {e}")
        return False


def read_borsa_from_file(date: str = None) -> dict:
    """
    borsa.json dosyasından borsa verilerini okur.
    
    Args:
        date: Tarih (YYYY-MM-DD formatında). None ise bugünün tarihi kullanılır.
    
    Returns:
        Borsa verisi dict'i veya None
    """
    if date is None:
        date = datetime.now().strftime('%Y-%m-%d')
    
    file_path = get_json_file_path('borsa.json')
    
    if not os.path.exists(file_path):
        print(f"⚠️ borsa.json dosyası bulunamadı: {file_path}")
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Eğer data bir dict ise ve 'data' key'i varsa, o tarih için veri ara
        if isinstance(data, dict):
            if date in data:
                print(f"✅ borsa.json'dan {date} tarihli veri okundu")
                return data[date]
            else:
                print(f"⚠️ borsa.json'da {date} tarihli veri bulunamadı")
                return None
        else:
            print(f"⚠️ borsa.json formatı beklenmedik")
            return None
    except json.JSONDecodeError as e:
        print(f"❌ borsa.json parse hatası: {e}")
        return None
    except Exception as e:
        print(f"❌ borsa.json okuma hatası: {e}")
        return None


def write_borsa_to_file(borsa_data: dict, date: str = None) -> bool:
    """
    Borsa verilerini borsa.json dosyasına yazar.
    funds.json ile TAM AYNI dizine yazar.
    
    Args:
        borsa_data: Borsa verisi dict'i
        date: Tarih (YYYY-MM-DD formatında). None ise bugünün tarihi kullanılır.
    
    Returns:
        True if successful, False otherwise
    """
    if date is None:
        date = datetime.now().strftime('%Y-%m-%d')
    
    file_path = get_json_file_path('borsa.json')
    
    # funds.json'ın dizinini kullan (zaten var olmalı)
    file_dir = os.path.dirname(file_path)
    if file_dir and not os.path.exists(file_dir):
        os.makedirs(file_dir, exist_ok=True)
    
    # Mevcut dosyayı oku (varsa)
    existing_data = {}
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except:
            existing_data = {}
    
    # Yeni veriyi ekle/güncelle
    if not isinstance(existing_data, dict):
        existing_data = {}
    
    existing_data[date] = borsa_data
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ borsa.json dosyasına {date} tarihli veri yazıldı: {file_path} (funds.json ile aynı dizinde: {os.path.dirname(file_path)})")
        return True
    except Exception as e:
        print(f"❌ borsa.json yazma hatası: {e}")
        return False


def get_borsa_metadata_from_file() -> dict:
    """
    borsa.json dosyasından metadata bilgisini okur (fetch_time vb.)
    
    Returns:
        Metadata dict'i veya None
    """
    file_path = get_json_file_path('borsa.json')
    
    if not os.path.exists(file_path):
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Eğer data bir dict ise ve 'metadata' key'i varsa
        if isinstance(data, dict) and 'metadata' in data:
            return data['metadata']
        
        # Eğer bugünün tarihli veri varsa, ondan fetch_time al
        today = datetime.now().strftime('%Y-%m-%d')
        if today in data and isinstance(data[today], dict):
            return {
                'fetch_time': data[today].get('fetch_time'),
                'date': today
            }
        
        return None
    except Exception as e:
        print(f"❌ borsa.json metadata okuma hatası: {e}")
        return None


# ============================================================================
# Fon Detay API Helper Fonksiyonları
# ============================================================================

def read_fund_api_quota() -> dict:
    """
    fund_api_quota.json dosyasından günlük istek sayısını okur.
    
    Returns:
        {
            'date': '2025-11-07',
            'request_count': 3,
            'last_request_time': '2025-11-07T14:30:00Z'
        }
    """
    file_path = get_json_file_path('fund_api_quota.json')
    
    if not os.path.exists(file_path):
        return {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'request_count': 0,
            'last_request_time': None
        }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Eğer tarih bugün değilse, sıfırla
        today = datetime.now().strftime('%Y-%m-%d')
        if data.get('date') != today:
            return {
                'date': today,
                'request_count': 0,
                'last_request_time': None
            }
        
        return data
    except Exception as e:
        print(f"❌ fund_api_quota.json okuma hatası: {e}")
        return {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'request_count': 0,
            'last_request_time': None
        }


def write_fund_api_quota(quota_data: dict) -> bool:
    """
    fund_api_quota.json dosyasına günlük istek sayısını yazar.
    
    Args:
        quota_data: {
            'date': '2025-11-07',
            'request_count': 3,
            'last_request_time': '2025-11-07T14:30:00Z'
        }
    
    Returns:
        True if successful, False otherwise
    """
    file_path = get_json_file_path('fund_api_quota.json')
    
    file_dir = os.path.dirname(file_path)
    if file_dir and not os.path.exists(file_dir):
        os.makedirs(file_dir, exist_ok=True)
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(quota_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ fund_api_quota.json güncellendi: {file_path}")
        return True
    except Exception as e:
        print(f"❌ fund_api_quota.json yazma hatası: {e}")
        return False


def increment_fund_api_quota() -> dict:
    """
    Günlük istek sayısını artırır ve yeni quota bilgisini döndürür.
    
    Returns:
        Güncellenmiş quota dict
    """
    quota = read_fund_api_quota()
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Eğer tarih bugün değilse, sıfırla
    if quota.get('date') != today:
        quota = {
            'date': today,
            'request_count': 0,
            'last_request_time': None
        }
    
    # Sayacı artır
    quota['request_count'] = quota.get('request_count', 0) + 1
    quota['last_request_time'] = datetime.now().isoformat()
    
    write_fund_api_quota(quota)
    return quota


def can_make_fund_api_request() -> tuple:
    """
    Fon API isteği yapılabilir mi kontrol eder.
    
    Returns:
        (can_request: bool, quota_info: dict)
    """
    quota = read_fund_api_quota()
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Eğer tarih bugün değilse, sıfırla ve izin ver
    if quota.get('date') != today:
        return True, {
            'date': today,
            'request_count': 0,
            'remaining': 10,
            'last_request_time': None
        }
    
    request_count = quota.get('request_count', 0)
    remaining = 10 - request_count
    
    return remaining > 0, {
        'date': today,
        'request_count': request_count,
        'remaining': remaining,
        'last_request_time': quota.get('last_request_time')
    }


def read_fund_detail_from_cache(fund_code: str) -> dict:
    """
    fundsDetails.json dosyasından fon detayını okur.
    
    Args:
        fund_code: Fon kodu (örn: 'GSP')
    
    Returns:
        {
            'lastFetchDate': '2025-11-07',
            'fetchTime': '2025-11-07T14:30:00Z',
            'data': { ... full API response ... }
        } veya None
    """
    file_path = get_json_file_path('fundsDetails.json')
    
    if not os.path.exists(file_path):
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Fon kodunu büyük harfe çevir (case-insensitive)
        fund_code_upper = fund_code.upper()
        
        if fund_code_upper in data:
            return data[fund_code_upper]
        
        return None
    except Exception as e:
        print(f"❌ fundsDetails.json okuma hatası: {e}")
        return None


def write_fund_detail_to_cache(fund_code: str, api_response: dict) -> bool:
    """
    fundsDetails.json dosyasına fon detayını yazar.
    Mevcut dosyayı okur, sadece ilgili fonu günceller.
    
    Args:
        fund_code: Fon kodu (örn: 'GSP')
        api_response: API'den gelen tam response
    
    Returns:
        True if successful, False otherwise
    """
    file_path = get_json_file_path('fundsDetails.json')
    
    file_dir = os.path.dirname(file_path)
    if file_dir and not os.path.exists(file_dir):
        os.makedirs(file_dir, exist_ok=True)
    
    # Mevcut dosyayı oku (varsa)
    existing_data = {}
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except:
            existing_data = {}
    
    # Fon kodunu büyük harfe çevir
    fund_code_upper = fund_code.upper()
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Yeni veriyi ekle/güncelle
    existing_data[fund_code_upper] = {
        'lastFetchDate': today,
        'fetchTime': datetime.now().isoformat(),
        'data': api_response
    }
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ fundsDetails.json güncellendi: {fund_code_upper}")
        return True
    except Exception as e:
        print(f"❌ fundsDetails.json yazma hatası: {e}")
        return False


def get_fund_price_from_line_values(line_values: list, target_date: str) -> dict:
    """
    lineValues array'inden belirli bir tarih için fiyat bilgisini bulur.
    
    Args:
        line_values: API response'daki lineValues array'i
        target_date: Hedef tarih (YYYY-MM-DD formatında)
    
    Returns:
        {
            'date': '2025-11-07',
            'value': 0.399107,
            'order': 123
        } veya None
    """
    if not line_values or not isinstance(line_values, list):
        return None
    
    # Tarih formatını normalize et
    try:
        target_dt = datetime.strptime(target_date, '%Y-%m-%d')
    except:
        return None
    
    # En yakın tarihi bul (eğer tam eşleşme yoksa)
    best_match = None
    min_diff = None
    
    for item in line_values:
        if 'date' not in item:
            continue
        
        try:
            item_date_str = item['date']
            # ISO formatından parse et (2020-11-06T00:00:00.000Z)
            if 'T' in item_date_str:
                item_date_str = item_date_str.split('T')[0]
            
            item_dt = datetime.strptime(item_date_str, '%Y-%m-%d')
            
            # Tam eşleşme varsa direkt döndür
            if item_dt.date() == target_dt.date():
                return {
                    'date': item_date_str,
                    'value': item.get('value', 0),
                    'order': item.get('order', 0)
                }
            
            # En yakın tarihi bul (geçmiş tarihler için)
            if item_dt.date() <= target_dt.date():
                diff = (target_dt.date() - item_dt.date()).days
                if min_diff is None or diff < min_diff:
                    min_diff = diff
                    best_match = {
                        'date': item_date_str,
                        'value': item.get('value', 0),
                        'order': item.get('order', 0)
                    }
        except Exception as e:
            print(f"⚠️ Tarih parse hatası: {e}")
            continue
    
    return best_match


def should_fetch_fund_detail_from_api(fund_code: str, target_date: str = None) -> tuple:
    """
    Fon detayı için API'den çekilmeli mi kontrol eder.
    
    Mantık:
    1. Eğer target_date geçmiş bir tarihse:
       - Cache'de fon var mı kontrol et
       - lineValues içinde target_date var mı kontrol et
       - Varsa → Cache'den oku (API'ye istek yok)
       - Yoksa → API'ye istek yap (eğer quota varsa)
    
    2. Eğer target_date bugün veya None ise:
       - Cache'de fon var mı ve lastFetchDate bugün mü kontrol et
       - Varsa ve bugünse → Cache'den oku
       - Yoksa veya eskiyse → API'ye istek yap (eğer quota varsa)
       - lineValues'ın son tarihi bugünden eskiyse → API'ye istek yap
    
    Args:
        fund_code: Fon kodu (örn: 'GSP')
        target_date: Hedef tarih (YYYY-MM-DD) veya None (bugün için)
    
    Returns:
        (should_fetch: bool, cached_data: dict or None)
    """
    today = datetime.now().strftime('%Y-%m-%d')
    
    # target_date None ise bugün kabul et
    if target_date is None:
        target_date = today
    
    # Cache'den oku
    cached = read_fund_detail_from_cache(fund_code)
    
    if cached is None:
        # Cache'de yok, API'den çek
        can_request, quota_info = can_make_fund_api_request()
        if not can_request:
            return False, None  # Quota yok, çekemeyiz
        return True, None  # Cache'de yok, API'den çek
    
    cached_data = cached.get('data', {})
    cached_date = cached.get('lastFetchDate')
    
    # API response yapısı: { "data": { "lineValues": [...] }, "success": true }
    line_values = []
    if isinstance(cached_data, dict):
        data_section = cached_data.get('data', {})
        if isinstance(data_section, dict):
            line_values = data_section.get('lineValues', [])
    
    # Geçmiş tarih kontrolü
    if target_date < today:
        # lineValues içinde bu tarih var mı?
        price_data = get_fund_price_from_line_values(line_values, target_date)
        if price_data:
            # Cache'den oku, API'ye istek yok
            print(f"✅ Geçmiş tarih ({target_date}) cache'de bulundu, API'ye istek yok")
            return False, cached_data
        else:
            # lineValues'da yok, API'ye istek yap (eğer quota varsa)
            can_request, quota_info = can_make_fund_api_request()
            if not can_request:
                return False, cached_data  # Quota yok, eski cache'i döndür
            return True, cached_data  # API'den çek
    
    # Bugün için kontrol
    if cached_date == today:
        # Bugün çekilmiş, lineValues'ın son tarihini kontrol et
        # API'den bugün çekilen veri, lineValues'da düne kadar oluyor (bugünün verisi henüz API'de yok)
        if line_values and len(line_values) > 0:
            # Son tarihi bul
            last_item = max(line_values, key=lambda x: x.get('date', ''))
            last_date_str = last_item.get('date', '')
            
            if 'T' in last_date_str:
                last_date_str = last_date_str.split('T')[0]
            
            try:
                last_date = datetime.strptime(last_date_str, '%Y-%m-%d').date()
                today_date = datetime.strptime(today, '%Y-%m-%d').date()
                yesterday_date = (today_date - timedelta(days=1))
                
                # Eğer lineValues'ın son tarihi dün ise → Cache'den oku (bugün çekilmiş ama bugünün verisi henüz API'de yok)
                if last_date == yesterday_date:
                    print(f"✅ Bugün çekilmiş veri, lineValues'ın son tarihi dün ({last_date_str}), cache'den okunacak")
                    return False, cached_data
                
                # Eğer lineValues'ın son tarihi dünden eski ise → Yeni veri çek
                if last_date < yesterday_date:
                    can_request, quota_info = can_make_fund_api_request()
                    if not can_request:
                        print(f"⚠️ Quota yok, eski cache kullanılacak (lastFetchDate: {cached_date}, lineValues son tarih: {last_date_str})")
                        return False, cached_data
                    print(f"🔄 Bugün çekilmiş ama lineValues'ın son tarihi ({last_date_str}) dünden eski, yeni veri çekilecek")
                    return True, cached_data
                
                # Eğer lineValues'ın son tarihi bugün veya bugünden yeni ise → Cache'den oku (bu durum normalde olmaz ama güvenlik için)
                print(f"✅ Bugün çekilmiş veri, lineValues'ın son tarihi ({last_date_str}) güncel, cache'den okunacak")
                return False, cached_data
            except Exception as e:
                print(f"⚠️ Tarih parse hatası: {e}, cache'den okunacak")
                return False, cached_data
        
        # lineValues yok veya boş, bugün çekilmişse cache'den oku
        print(f"✅ Bugün çekilmiş veri (lastFetchDate: {cached_date}), lineValues yok ama cache'den okunacak")
        return False, cached_data
    
    # Cache'deki tarih bugünden eski
    # Bu durumda lineValues'ın son tarihini kontrol et
    if line_values and len(line_values) > 0:
        # Son tarihi bul
        last_item = max(line_values, key=lambda x: x.get('date', ''))
        last_date_str = last_item.get('date', '')
        
        if 'T' in last_date_str:
            last_date_str = last_date_str.split('T')[0]
        
        try:
            last_date = datetime.strptime(last_date_str, '%Y-%m-%d').date()
            today_date = datetime.strptime(today, '%Y-%m-%d').date()
            yesterday_date = (today_date - timedelta(days=1))
            
            # Eğer lineValues'ın son tarihi dün veya bugün ise → Cache'den oku (güncel veri)
            if last_date >= yesterday_date:
                print(f"✅ Cache'deki tarih ({cached_date}) eski ama lineValues'ın son tarihi ({last_date_str}) güncel, cache'den okunacak")
                return False, cached_data
            
            # Eğer lineValues'ın son tarihi dünden eskiyse, yeni veri çek
            can_request, quota_info = can_make_fund_api_request()
            if not can_request:
                print(f"⚠️ Quota yok, eski cache kullanılacak (lastFetchDate: {cached_date}, lineValues son tarih: {last_date_str})")
                return False, cached_data
            print(f"🔄 Cache'deki tarih ({cached_date}) ve lineValues'ın son tarihi ({last_date_str}) eski, yeni veri çekilecek")
            return True, cached_data
        except Exception as e:
            print(f"⚠️ Tarih parse hatası: {e}, cache'den okunacak")
            return False, cached_data
    
    # lineValues yok veya boş, yeni veri çek
    can_request, quota_info = can_make_fund_api_request()
    if not can_request:
        print(f"⚠️ Quota yok, eski cache kullanılacak (lastFetchDate: {cached_date})")
        return False, cached_data
    print(f"🔄 Cache'deki tarih ({cached_date}) bugünden eski ve lineValues yok, yeni veri çekilecek")
    return True, cached_data  # API'den çek


class GetMainDataView(APIView):
    """
    Finans API (finans.truncgil.com) JSON API'sinden 
    döviz kurlarını döndürür.
    Akıllı zaman kontrolü yapar: Firestore'daki fetch_time'ı kontrol eder
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Döviz kurlarını getirir.
        Akıllı zaman kontrolü:
        - Firestore'dan bugünün verisini kontrol eder
        - Eğer bugün için veri yoksa veya bir sonraki fetch saatine gelmişse → Veri çeker
        - Aksi halde Firestore'dan mevcut veriyi döndürür
        """
        try:
            print("\n" + "="*60)
            print("🌐 API Request: /api/currencies/getmain/")
            print("="*60)
            
            print("🔧 Service başlatılıyor...")
            service = get_tcmb_service()
            today = datetime.now().strftime('%Y-%m-%d')
            current_time = datetime.now().strftime('%H:%M')
            print(f"✅ Service hazır. Tarih: {today}, Saat: {current_time}")
            
            # Local dosyadan bugünün verisini kontrol et
            existing_fetch_time = None
            file_exists = False
            try:
                print("📂 Local dosyadan metadata kontrol ediliyor...")
                file_path = get_json_file_path('currencies.json')
                file_exists = os.path.exists(file_path)
                
                if file_exists:
                    file_data = read_currencies_from_file()
                    metadata = file_data.get('metadata', {})
                    if metadata and metadata.get('fetch_time'):
                        existing_fetch_time = metadata.get('fetch_time')
                        print(f"📂 Local dosyada bugünün metadata verisi var. fetch_time: {existing_fetch_time}")
                    else:
                        print("📂 Local dosyada metadata bulunamadı")
                else:
                    print(f"📂 currencies.json dosyası bulunamadı (ilk kez çalıştırılıyor): {file_path}")
            except Exception as e:
                print(f"⚠️ Local dosya kontrol hatası (devam ediliyor): {e}")
                import traceback
                print(f"⚠️ Hata detayı: {traceback.format_exc()}")
            
            # Yeni veri çekilmeli mi?
            print(f"🔍 Akıllı zaman kontrolü yapılıyor...")
            print(f"   - Mevcut saat: {current_time}")
            print(f"   - Dosya var mı: {file_exists}")
            print(f"   - Son çekilen veri: {existing_fetch_time or 'Yok'}")
            
            # Eğer dosya yoksa, ilk kez çalıştırılıyor demektir - her zaman API'den çek
            if not file_exists:
                print("   ⚠️ Dosya yok, ilk kez çalıştırılıyor - API'den çekilecek")
                should_fetch = True
            else:
                try:
                    should_fetch = service.should_fetch_new_data(existing_fetch_time)
                    print(f"   - Sonuç: {'✅ YENİ VERİ ÇEKİLECEK' if should_fetch else '⏰ MEVCUT VERİ KULLANILACAK'}")
                except Exception as e:
                    print(f"❌ should_fetch_new_data hatası: {e}")
                    import traceback
                    print(f"❌ Hata detayı: {traceback.format_exc()}")
                    # Hata durumunda mevcut veriyi kullan
                    should_fetch = False
            
            if not should_fetch:
                print(f"⏰ Yeni veri çekilmeyecek. Şu anki saat: {current_time}")
                if existing_fetch_time:
                    print(f"✅ Mevcut veri kullanılacak (fetch_time: {existing_fetch_time})")
                else:
                    print("⚠️ Bugün için veri yok, ancak saat uygun değil")
                print("="*60 + "\n")
                
                # Local dosyadan mevcut veriyi döndür
                try:
                    print(f"📚 Local dosyadan currencies okunuyor...")
                    file_data = read_currencies_from_file()
                    
                    exchange_rates = file_data.get('exchange_rates', {})
                    gold_prices = file_data.get('gold_prices', {})
                    crypto_currencies = file_data.get('crypto_currencies', {})
                    precious_metals = file_data.get('precious_metals', {})
                    metadata = file_data.get('metadata', {})
                    
                    print(f"✅ Local dosyadan okundu: {len(exchange_rates)} döviz, {len(gold_prices)} altın, {len(crypto_currencies)} kripto, {len(precious_metals)} metal")
                    
                    date = metadata.get('date', today)
                    date_en = metadata.get('date_en', '')
                    
                    formatted_data = {
                        'exchange_rates': exchange_rates,
                        'gold_prices': gold_prices,
                        'crypto_currencies': crypto_currencies,
                        'precious_metals': precious_metals,
                        'last_updated': metadata.get('last_updated', datetime.now().isoformat()),
                        'date': date,
                        'date_en': date_en
                    }
                    
                    response_data = {
                        "success": True,
                        "data": formatted_data,
                        "date": today,
                        "source": "local_file",
                        "cached": True,
                        "message": "Mevcut veri kullanılıyor"
                    }
                    print(f"✅ GetMainDataView: Response döndürülüyor (Local File) - {len(exchange_rates)} döviz, {len(gold_prices)} altın, {len(crypto_currencies)} kripto, {len(precious_metals)} metal")
                    print("="*60 + "\n")
                    return Response(response_data, status=status.HTTP_200_OK)
                except Exception as e:
                    print(f"⚠️ Local dosyadan okuma hatası: {e}")
                    import traceback
                    print(f"⚠️ Hata detayı: {traceback.format_exc()}")
                
                # Local dosyadan okunamadıysa, API'den çek
                print("📞 Local dosyadan veri alınamadı, API'den çekiliyor...")
            
            print(f"✅ Yeni veri çekilecek. Şu anki saat: {current_time}")
            if existing_fetch_time:
                print(f"   Son çekilen veri: {existing_fetch_time}")
            print("📞 Finans API servisi çağrılıyor...")
            
            # API'den veri çek
            try:
                data = service.get_formatted_rates()
                print(f"📊 API'den veri alındı: {data is not None}")
            except Exception as api_error:
                print(f"❌ API çağrısı hatası: {api_error}")
                import traceback
                print(f"❌ API hata detayı: {traceback.format_exc()}")
                data = None
            
            if data is None:
                print("❌ Finans API servisinden veri alınamadı")
                print("="*60 + "\n")
                return Response(
                    {
                        "success": False,
                        "error": "Finans API servisinden veri alınamadı",
                        "message": "Finans API'sine erişilemedi. Lütfen daha sonra tekrar deneyin."
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Local dosyaya kaydet
            print(f"💾 Local dosyaya kayıt başlıyor...")
            try:
                # Metadata'yı hazırla
                metadata = {
                    'date': data.get('date', today),
                    'date_en': data.get('date_en', ''),
                    'fetch_time': data.get('fetch_time', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                    'timestamp': data.get('timestamp', datetime.now().isoformat()),
                    'source': 'Finans API',
                    'last_updated': datetime.now().isoformat()
                }
                
                # Dosyaya yazılacak veri yapısı
                file_data = {
                    'exchange_rates': data.get('exchange_rates', {}),
                    'gold_prices': data.get('gold_prices', {}),
                    'crypto_currencies': data.get('crypto_currencies', {}),
                    'precious_metals': data.get('precious_metals', {}),
                    'metadata': metadata
                }
                
                currency_count = len(data.get('exchange_rates', {}))
                gold_count = len(data.get('gold_prices', {}))
                crypto_count = len(data.get('crypto_currencies', {}))
                metal_count = len(data.get('precious_metals', {}))
                
                success = write_currencies_to_file(file_data)
                
                if success:
                    print(f"✅ Local dosyaya kayıt başarılı!")
                    print(f"   - Toplam: {currency_count} döviz, {gold_count} altın, {crypto_count} kripto, {metal_count} metal")
                    print(f"   - Tarih: {today}")
                    print(f"   - Çekilme saati: {data.get('fetch_time')}")
                    print("="*60 + "\n")
                else:
                    print(f"⚠️ Local dosyaya kayıt başarısız!")
            except Exception as file_error:
                print(f"❌ Local dosyaya kaydetme hatası: {file_error}")
                import traceback
                print(f"❌ Hata detayı: {traceback.format_exc()}")
                logger.error(f"Local dosyaya kaydetme hatası: {file_error}", exc_info=True)
            
            print(f"✅ Veri başarıyla alındı!")
            print(f"   - Döviz kurları: {len(data.get('exchange_rates', {}))} adet")
            print(f"   - Altın: {len(data.get('gold_prices', {}))} adet")
            print(f"   - Kripto: {len(data.get('crypto_currencies', {}))} adet")
            print(f"   - Metaller: {len(data.get('precious_metals', {}))} adet")
            print(f"   - Tarih: {data.get('date', 'N/A')}")
            print("="*60 + "\n")
            
            response_data = {
                "success": True,
                "data": data,
                "source": "Finans API",
                "saved_to_local_file": True,
                "date": today,
                "fetch_time": data.get('fetch_time')
            }
            print(f"✅ GetMainDataView: Response döndürülüyor (API) - {len(data.get('exchange_rates', {}))} döviz, {len(data.get('gold_prices', {}))} altın, {len(data.get('crypto_currencies', {}))} kripto, {len(data.get('precious_metals', {}))} metal")
            print("="*60 + "\n")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ GetMainDataView hatası: {e}")
            import traceback
            print(f"❌ Hata detayı: {traceback.format_exc()}")
            print("="*60 + "\n")
            logger.error(f"GetMainDataView hatası: {e}", exc_info=True)
            response_data = {
                "error": "Sunucu hatası",
                "message": str(e)
            }
            print(f"❌ GetMainDataView: Hata response döndürülüyor")
            print("="*60 + "\n")
            return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExchangeRatesView(APIView):
    """
    Sadece döviz kurlarını döndüren view (TCMB)
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Sadece döviz kurlarını döndürür"""
        try:
            service = get_tcmb_service()
            data = service.get_formatted_rates()
            
            if data is None:
                return Response(
                    {"error": "Veri alınamadı"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            return Response(
                {
                    "success": True,
                    "exchange_rates": data.get('exchange_rates', {}),
                    "last_updated": data.get('last_updated'),
                    "date": data.get('date')
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"ExchangeRatesView hatası: {e}")
            return Response(
                {"error": "Sunucu hatası"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GoldPricesView(APIView):
    """
    Finans API altın fiyatlarını döndüren view
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Finans API'den altın fiyatlarını döndürür"""
        try:
            service = get_tcmb_service()
            data = service.get_formatted_rates()
            
            if data is None:
                return Response(
                    {
                        "success": False,
                        "gold_prices": {},
                        "error": "Veri alınamadı"
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            return Response(
                {
                    "success": True,
                    "gold_prices": data.get('gold_prices', {}),
                    "precious_metals": data.get('precious_metals', {}),
                    "last_updated": data.get('last_updated'),
                    "date": data.get('date')
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"GoldPricesView hatası: {e}")
            return Response(
                {"error": "Sunucu hatası"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BorsaDataView(APIView):
    """
    CollectAPI'den borsa verilerini çekip Firestore'a kaydeden view
    Akıllı zaman kontrolü yapar: Firestore'daki fetch_time'ı kontrol eder
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Borsa verilerini çekip Firestore'a kaydeder.
        Akıllı zaman kontrolü:
        - Firestore'dan bugünün verisini kontrol eder
        - Eğer bugün için veri yoksa veya bir sonraki fetch saatine gelmişse → Veri çeker
        - Aksi halde Firestore'dan mevcut veriyi döndürür
        """
        try:
            print("\n" + "="*60)
            print("📈 API Request: /api/currencies/borsa/")
            print("="*60)
            
            service = get_borsa_service()
            today = datetime.now().strftime('%Y-%m-%d')
            current_time = datetime.now().strftime('%H:%M')
            
            # Local dosyadan bugünün verisini kontrol et
            existing_fetch_time = None
            file_exists = False
            try:
                print("📂 Local dosyadan metadata kontrol ediliyor...")
                file_path = get_json_file_path('borsa.json')
                file_exists = os.path.exists(file_path)
                
                if file_exists:
                    metadata = get_borsa_metadata_from_file()
                    if metadata and metadata.get('fetch_time'):
                        existing_fetch_time = metadata.get('fetch_time')
                        print(f"📂 Local dosyada bugünün verisi var. fetch_time: {existing_fetch_time}")
                    else:
                        print("📂 Local dosyada metadata bulunamadı")
                else:
                    print(f"📂 borsa.json dosyası bulunamadı (ilk kez çalıştırılıyor): {file_path}")
            except Exception as e:
                print(f"⚠️ Local dosya kontrol hatası (devam ediliyor): {e}")
            
            # Yeni veri çekilmeli mi?
            print(f"🔍 Akıllı zaman kontrolü yapılıyor...")
            print(f"   - Mevcut saat: {current_time}")
            print(f"   - Dosya var mı: {file_exists}")
            print(f"   - Son çekilen veri: {existing_fetch_time or 'Yok'}")
            
            # Eğer dosya yoksa, ilk kez çalıştırılıyor demektir - her zaman API'den çek
            if not file_exists:
                print("   ⚠️ Dosya yok, ilk kez çalıştırılıyor - API'den çekilecek")
                should_fetch = True
            else:
                should_fetch = service.should_fetch_new_data(existing_fetch_time)
                print(f"   - Sonuç: {'✅ YENİ VERİ ÇEKİLECEK' if should_fetch else '⏰ MEVCUT VERİ KULLANILACAK'}")
            
            if not should_fetch:
                print(f"⏰ Yeni veri çekilmeyecek. Şu anki saat: {current_time}")
                if existing_fetch_time:
                    print(f"✅ Mevcut veri kullanılacak (fetch_time: {existing_fetch_time})")
                else:
                    print("⚠️ Bugün için veri yok, ancak saat uygun değil")
                print("="*60 + "\n")
                
                # Local dosyadan mevcut veriyi döndür veya dünün verisini dene
                if existing_fetch_time:
                    try:
                        borsa_data = read_borsa_from_file(today)
                        if borsa_data:
                            return Response(
                                {
                                    "success": True,
                                    "data": borsa_data,
                                    "date": today,
                                    "source": "local_file",
                                    "cached": True,
                                    "message": "Mevcut veri kullanılıyor"
                                },
                                status=status.HTTP_200_OK
                            )
                    except Exception as e:
                        print(f"⚠️ Local dosyadan okuma hatası: {e}")
                
                # Bugünün verisi yoksa, dünün verisini dene (dövizlerdeki gibi)
                if not existing_fetch_time:
                    from datetime import timedelta
                    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                    print(f"⚠️ Bugünün verisi bulunamadı, dünün verisi deneniyor: {yesterday}")
                    try:
                        borsa_data = read_borsa_from_file(yesterday)
                        if borsa_data:
                            return Response(
                                {
                                    "success": True,
                                    "data": borsa_data,
                                    "date": yesterday,
                                    "source": "local_file",
                                    "cached": True,
                                    "warning": f"Bugünün verisi henüz yok, dünün verisi gösteriliyor ({yesterday})"
                                },
                                status=status.HTTP_200_OK
                            )
                    except Exception as e:
                        print(f"⚠️ Dünün verisi okunurken hata: {e}")
                
                # Eğer bugün için veri yoksa ve saat uygun değilse
                return Response(
                    {
                        "success": False,
                        "message": f"Veri çekme saati değil. Şu anki saat: {current_time}",
                        "fetch_times": ["10:00", "13:30", "17:00"],
                        "current_time": current_time,
                        "has_today_data": existing_fetch_time is not None
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Hafta içi kontrolü
            if not service.is_weekday():
                print("⏰ Bugün hafta sonu, borsa kapalı")
                print("="*60 + "\n")
                return Response(
                    {
                        "success": False,
                        "message": "Bugün hafta sonu, borsa kapalı"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"✅ Yeni veri çekilecek. Şu anki saat: {current_time}")
            if existing_fetch_time:
                print(f"   Son çekilen veri: {existing_fetch_time}")
            print("📞 CollectAPI servisi çağrılıyor...")
            
            # API'den veri çek
            borsa_data = service.get_borsa_data()
            
            if borsa_data is None:
                print("❌ CollectAPI servisinden veri alınamadı")
                print("="*60 + "\n")
                return Response(
                    {
                        "success": False,
                        "error": "CollectAPI servisinden veri alınamadı",
                        "message": "Borsa API'sine erişilemedi. Lütfen daha sonra tekrar deneyin."
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Local dosyaya kaydet
            try:
                today = datetime.now().strftime('%Y-%m-%d')
                
                # Veri yapısını hazırla
                stock_data = {
                    'date': today,
                    'fetch_time': borsa_data.get('fetch_time'),
                    'timestamp': borsa_data.get('timestamp'),
                    'source': borsa_data.get('source'),
                    'total_count': borsa_data.get('total_count', 0),
                    'last_updated': datetime.now().isoformat(),
                    'stocks': borsa_data.get('stocks', [])
                }
                
                success = write_borsa_to_file(stock_data, today)
                
                if success:
                    print(f"✅ Local dosyaya kayıt başarılı!")
                    print(f"   - Hisse senetleri: {len(borsa_data.get('stocks', []))} adet")
                    print(f"   - Tarih: {today}")
                    print(f"   - Çekilme saati: {borsa_data.get('fetch_time')}")
                    print("="*60 + "\n")
                    
                    return Response(
                        {
                            "success": True,
                            "data": borsa_data,
                            "saved_to_local_file": True,
                            "date": today,
                            "fetch_time": borsa_data.get('fetch_time')
                        },
                        status=status.HTTP_200_OK
                    )
                else:
                    print(f"⚠️ Local dosyaya kayıt başarısız!")
                    return Response(
                        {
                            "success": True,
                            "data": borsa_data,
                            "saved_to_local_file": False,
                            "warning": "Veri local dosyaya kaydedilemedi, ancak API'den veri alındı"
                        },
                        status=status.HTTP_200_OK
                    )
                
            except Exception as file_error:
                print(f"❌ Local dosyaya kaydetme hatası: {file_error}")
                logger.error(f"Local dosyaya kaydetme hatası: {file_error}")
                
                # Dosya hatası olsa bile API'den gelen veriyi döndür
                return Response(
                    {
                        "success": True,
                        "data": borsa_data,
                        "saved_to_local_file": False,
                        "warning": "Veri local dosyaya kaydedilemedi, ancak API'den veri alındı",
                        "error": str(file_error)
                    },
                    status=status.HTTP_200_OK
                )
            
        except Exception as e:
            print(f"❌ BorsaDataView hatası: {e}")
            print("="*60 + "\n")
            logger.error(f"BorsaDataView hatası: {e}")
            return Response(
                {
                    "error": "Sunucu hatası",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BorsaDataListView(APIView):
    """
    Borsa verilerini getiren view (akıllı kontrol ile)
    Bugün için veri isteniyorsa, otomatik olarak yeni veri çekilip çekilmeyeceğini kontrol eder
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Borsa verilerini getirir.
        Bugün için veri isteniyorsa:
        - Otomatik olarak yeni veri çekilip çekilmeyeceğini kontrol eder
        - Gerekirse yeni veri çeker, aksi halde local dosyadan döndürür
        Geçmiş tarih için:
        - Local dosyadan okur
        Query param: date (opsiyonel, yoksa bugünün tarihi)
        """
        try:
            service = get_borsa_service()
            
            # Tarih parametresi (opsiyonel)
            date_param = request.query_params.get('date')
            if date_param:
                target_date = date_param
            else:
                target_date = datetime.now().strftime('%Y-%m-%d')
            
            today = datetime.now().strftime('%Y-%m-%d')
            
            # Eğer bugün için veri isteniyorsa, akıllı kontrol yap
            if target_date == today:
                # Local dosyadan bugünün verisini kontrol et
                existing_fetch_time = None
                file_exists = False
                try:
                    file_path = get_json_file_path('borsa.json')
                    file_exists = os.path.exists(file_path)
                    
                    if file_exists:
                        metadata = get_borsa_metadata_from_file()
                        if metadata and metadata.get('fetch_time'):
                            existing_fetch_time = metadata.get('fetch_time')
                    else:
                        print(f"📂 borsa.json dosyası bulunamadı (ilk kez çalıştırılıyor): {file_path}")
                except Exception as e:
                    logger.warning(f"Local dosya kontrol hatası: {e}")
                
                # Yeni veri çekilmeli mi?
                # Eğer dosya yoksa, ilk kez çalıştırılıyor demektir - her zaman API'den çek
                if not file_exists:
                    print(f"🔄 BorsaDataListView: Dosya yok, ilk kez çalıştırılıyor - API'den çekilecek")
                    should_fetch = True
                else:
                    should_fetch = service.should_fetch_new_data(existing_fetch_time)
                
                if should_fetch:
                    # Yeni veri çekilmeli, BorsaDataView mantığını kullan
                    print(f"🔄 BorsaDataListView: Yeni veri çekilecek (fetch_time: {existing_fetch_time})")
                    
                    # Hafta içi kontrolü
                    if not service.is_weekday():
                        # Hafta sonu, mevcut veriyi döndür
                        if existing_fetch_time:
                            borsa_data = read_borsa_from_file(today)
                            if borsa_data:
                                return Response(
                                    {
                                        "success": True,
                                        "data": borsa_data,
                                        "date": today,
                                        "source": "local_file",
                                        "cached": True
                                    },
                                    status=status.HTTP_200_OK
                                )
                    
                    # API'den veri çek
                    borsa_data = service.get_borsa_data()
                    if borsa_data is None:
                        # API hatası, mevcut veriyi döndür
                        if existing_fetch_time:
                            borsa_data = read_borsa_from_file(today)
                            if borsa_data:
                                return Response(
                                    {
                                        "success": True,
                                        "data": borsa_data,
                                        "date": today,
                                        "source": "local_file",
                                        "cached": True,
                                        "warning": "Yeni veri çekilemedi, mevcut veri kullanılıyor"
                                    },
                                    status=status.HTTP_200_OK
                                )
                        return Response(
                            {
                                "success": False,
                                "error": "Veri alınamadı"
                            },
                            status=status.HTTP_503_SERVICE_UNAVAILABLE
                        )
                    
                    # Local dosyaya kaydet
                    try:
                        stock_data = {
                            'date': today,
                            'fetch_time': borsa_data.get('fetch_time'),
                            'timestamp': borsa_data.get('timestamp'),
                            'source': borsa_data.get('source'),
                            'total_count': borsa_data.get('total_count', 0),
                            'last_updated': datetime.now().isoformat(),
                            'stocks': borsa_data.get('stocks', [])
                        }
                        write_borsa_to_file(stock_data, today)
                    except Exception as e:
                        logger.error(f"Local dosyaya kaydetme hatası: {e}")
                    
                    return Response(
                        {
                            "success": True,
                            "data": borsa_data,
                            "date": today,
                            "source": "api",
                            "cached": False
                        },
                        status=status.HTTP_200_OK
                    )
            
            # Bugün için değilse veya yeni veri çekilmeyecekse, local dosyadan oku
            borsa_data = read_borsa_from_file(target_date)
            
            if borsa_data:
                response_data = {
                    "success": True,
                    "data": borsa_data,
                    "date": target_date,
                    "source": "local_file",
                    "cached": True
                }
                print(f"✅ BorsaDataListView: Response döndürülüyor (Local File) - {len(borsa_data.get('stocks', []))} hisse")
                print("="*60 + "\n")
                return Response(response_data, status=status.HTTP_200_OK)
            
            # Bugünün verisi yoksa, dünün verisini dene (dövizlerdeki gibi)
            if target_date == today:
                from datetime import timedelta
                yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                print(f"⚠️ Bugünün verisi bulunamadı, dünün verisi deneniyor: {yesterday}")
                borsa_data = read_borsa_from_file(yesterday)
                
                if borsa_data:
                    response_data = {
                        "success": True,
                        "data": borsa_data,
                        "date": yesterday,
                        "source": "local_file",
                        "cached": True,
                        "warning": f"Bugünün verisi henüz yok, dünün verisi gösteriliyor ({yesterday})"
                    }
                    print(f"✅ BorsaDataListView: Dünün verisi döndürülüyor - {len(borsa_data.get('stocks', []))} hisse")
                    print("="*60 + "\n")
                    return Response(response_data, status=status.HTTP_200_OK)
            
            # Local dosyada bulunamadı
            return Response(
                {
                    "success": False,
                    "error": f"{target_date} tarihine ait borsa verisi bulunamadı",
                    "date": target_date
                },
                status=status.HTTP_404_NOT_FOUND
            )
            
        except Exception as e:
            logger.error(f"BorsaDataListView hatası: {e}")
            return Response(
                {
                    "error": "Sunucu hatası",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FundsListView(APIView):
    """
    Funds verilerini JSON dosyasından getiren view
    Tüm kullanıcılar için global funds havuzu
    Quota kısıtlaması nedeniyle Firestore yerine JSON dosyasından okunuyor
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Funds verilerini funds.json dosyasından getirir.
        Tüm funds'ları döndürür (global havuz).
        """
        try:
            print("\n" + "="*60)
            print("💰 API Request: /api/currencies/funds/")
            print("="*60)
            
            import json
            import os
            
            # JSON dosyasının yolunu bul
            # Önce mevcut dizinde (currencies klasörü) ara
            current_dir = os.path.dirname(os.path.abspath(__file__))
            funds_json_path = os.path.join(current_dir, 'funds.json')
            
            # Eğer bulunamazsa, proje kök dizininde ara
            if not os.path.exists(funds_json_path):
                # Proje kök dizinini bul (settings.py'den 2 seviye yukarı)
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
                funds_json_path = os.path.join(base_dir, 'funds.json')
            
            if not os.path.exists(funds_json_path):
                print(f"❌ funds.json dosyası bulunamadı. Aranan yollar:")
                print(f"   1. {os.path.join(current_dir, 'funds.json')}")
                print(f"   2. {funds_json_path}")
                return Response(
                    {
                        "success": False,
                        "error": "Funds JSON dosyası bulunamadı"
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            print(f"📂 Funds JSON dosyası okunuyor: {funds_json_path}")
            
            # JSON dosyasını oku
            try:
                with open(funds_json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # data.data array'ini al
                if isinstance(data, dict) and 'data' in data:
                    funds_data = data['data']
                elif isinstance(data, list):
                    funds_data = data
                else:
                    return Response(
                        {
                            "success": False,
                            "error": "JSON formatı beklenmedik. 'data' array'i bulunamadı."
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                # Formatla
                funds_list = []
                for fund in funds_data:
                    funds_list.append({
                        'key': fund.get('key', ''),
                        'value': fund.get('value', ''),
                        'id': fund.get('key', '')  # key'i id olarak kullan
                    })
                
                # Key'e göre sırala
                funds_list.sort(key=lambda x: x.get('key', ''))
                
                print(f"✅ Funds verileri alındı: {len(funds_list)} adet (JSON dosyasından)")
                print("="*60 + "\n")
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON parse hatası: {e}")
                return Response(
                    {
                        "success": False,
                        "error": "JSON dosyası parse edilemedi",
                        "message": str(e)
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except Exception as e:
                print(f"❌ Funds okuma hatası: {e}")
                raise  # Hataları yukarı fırlat
            
            response_data = {
                "success": True,
                "data": {
                    "funds": funds_list,
                    "total_count": len(funds_list)
                },
                "source": "json_file"
            }
            print(f"✅ FundsListView: Response döndürülüyor - {len(funds_list)} fon")
            print("="*60 + "\n")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ FundsListView hatası: {e}")
            logger.error(f"FundsListView hatası: {e}")
            return Response(
                {
                    "success": False,
                    "error": "Sunucu hatası",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FundDetailView(APIView):
    """
    Fon detay bilgilerini RapidAPI'den çeken view.
    Akıllı cache mantığı kullanır:
    - Bugün için: Cache'de bugünün verisi varsa → Cache'den oku
    - Geçmiş tarih için: lineValues içinde tarih varsa → Cache'den oku
    - Günlük 10 istek limiti kontrolü yapar
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Fon detay bilgilerini getirir.
        
        Query Parameters:
            fund_code: Fon kodu (örn: 'GSP') - ZORUNLU
            date: Hedef tarih (YYYY-MM-DD) - OPSİYONEL (None ise bugün)
        
        Returns:
            {
                "success": true,
                "data": { ... API response ... },
                "quota": {
                    "remaining": 7,
                    "request_count": 3
                },
                "source": "cache" | "api",
                "cached": true | false
            }
        """
        try:
            print("\n" + "="*60)
            print("💰 API Request: /api/currencies/fund-detail/")
            print("="*60)
            
            fund_code = request.query_params.get('fund_code')
            target_date = request.query_params.get('date', None)
            
            if not fund_code:
                return Response(
                    {
                        "success": False,
                        "error": "fund_code parametresi gerekli"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            fund_code = fund_code.upper().strip()
            today = datetime.now().strftime('%Y-%m-%d')
            
            print(f"📋 Fon Kodu: {fund_code}")
            print(f"📅 Hedef Tarih: {target_date or today}")
            
            # Akıllı cache kontrolü
            should_fetch, cached_data = should_fetch_fund_detail_from_api(fund_code, target_date)
            
            # Quota bilgisini al
            can_request, quota_info = can_make_fund_api_request()
            
            if should_fetch:
                # API'den çek
                if not can_request:
                    # Quota yok, cache'deki eski veriyi döndür (varsa)
                    if cached_data:
                        print(f"⚠️ Quota doldu, cache'deki eski veri döndürülüyor")
                        return Response(
                            {
                                "success": True,
                                "data": cached_data,
                                "quota": quota_info,
                                "source": "cache",
                                "cached": True,
                                "warning": "Günlük API limiti doldu, cache'deki veri gösteriliyor"
                            },
                            status=status.HTTP_200_OK
                        )
                    else:
                        return Response(
                            {
                                "success": False,
                                "error": "Günlük API limiti doldu",
                                "quota": quota_info,
                                "message": "Günlük 10 istek hakkınız doldu. Lütfen yarın tekrar deneyin."
                            },
                            status=status.HTTP_429_TOO_MANY_REQUESTS
                        )
                
                # RapidAPI'ye istek at
                print(f"🌐 RapidAPI'ye istek atılıyor...")
                
                url = f"https://tefas-api.p.rapidapi.com/api/v1/funds/{fund_code}"
                headers = {
                    'x-rapidapi-host': 'tefas-api.p.rapidapi.com',
                    'x-rapidapi-key': '36eda80378msheada1440418a37ep18b1ecjsnded195077827'
                }
                
                try:
                    response = requests.get(url, headers=headers, timeout=30)
                    response.raise_for_status()
                    api_data = response.json()
                    
                    print(f"✅ RapidAPI'den veri alındı")
                    
                    # Cache'e kaydet
                    write_fund_detail_to_cache(fund_code, api_data)
                    
                    # Quota'yı artır
                    updated_quota = increment_fund_api_quota()
                    
                    print(f"💾 Cache'e kaydedildi")
                    print(f"📊 Kalan istek hakkı: {10 - updated_quota.get('request_count', 0)}")
                    print("="*60 + "\n")
                    
                    return Response(
                        {
                            "success": True,
                            "data": api_data,
                            "quota": {
                                "remaining": 10 - updated_quota.get('request_count', 0),
                                "request_count": updated_quota.get('request_count', 0)
                            },
                            "source": "api",
                            "cached": False
                        },
                        status=status.HTTP_200_OK
                    )
                except requests.exceptions.RequestException as e:
                    print(f"❌ RapidAPI hatası: {e}")
                    # Hata durumunda cache'deki veriyi döndür (varsa)
                    if cached_data:
                        print(f"⚠️ API hatası, cache'deki veri döndürülüyor")
                        return Response(
                            {
                                "success": True,
                                "data": cached_data,
                                "quota": quota_info,
                                "source": "cache",
                                "cached": True,
                                "warning": "API'ye erişilemedi, cache'deki veri gösteriliyor"
                            },
                            status=status.HTTP_200_OK
                        )
                    else:
                        return Response(
                            {
                                "success": False,
                                "error": "API'ye erişilemedi",
                                "message": str(e)
                            },
                            status=status.HTTP_503_SERVICE_UNAVAILABLE
                        )
            else:
                # Cache'den oku
                print(f"✅ Cache'den veri okunuyor")
                print(f"📊 Kalan istek hakkı: {quota_info.get('remaining', 0)}")
                print("="*60 + "\n")
                
                return Response(
                    {
                        "success": True,
                        "data": cached_data,
                        "quota": quota_info,
                        "source": "cache",
                        "cached": True
                    },
                    status=status.HTTP_200_OK
                )
                
        except Exception as e:
            print(f"❌ FundDetailView hatası: {e}")
            logger.error(f"FundDetailView hatası: {e}")
            import traceback
            print(traceback.format_exc())
            return Response(
                {
                    "success": False,
                    "error": "Sunucu hatası",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FundPriceCheckView(APIView):
    """
    Fon fiyat kontrolü için view.
    Cache'den fiyat bilgisini kontrol eder, API isteği atmaz.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Fon fiyatını kontrol eder (cache'den okur, API'ye istek atmaz).
        
        Query Parameters:
            fund_code: Fon kodu (örn: 'GSP') - ZORUNLU
            date: Hedef tarih (YYYY-MM-DD) - OPSİYONEL (None ise bugün)
        
        Returns:
            {
                "success": true,
                "has_price": true/false,
                "price": 0.399107,  // varsa
                "date": "2025-11-07",  // varsa
                "needs_api_request": true/false,  // API isteği gerekli mi?
                "quota": { ... }  // quota bilgisi
            }
        """
        try:
            fund_code = request.query_params.get('fund_code', '').upper().strip()
            target_date = request.query_params.get('date', None)
            
            if not fund_code:
                return Response(
                    {
                        "success": False,
                        "error": "fund_code parametresi gerekli"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            today = datetime.now().strftime('%Y-%m-%d')
            if target_date is None:
                target_date = today
            
            # Quota bilgisini al
            can_request, quota_info = can_make_fund_api_request()
            
            # Cache'den fon detayını oku
            cached_data = read_fund_detail_from_cache(fund_code)
            
            print(f"🔍 Cache'den okunan veri: {fund_code}")
            print(f"📦 cached_data tipi: {type(cached_data)}")
            if cached_data:
                print(f"📦 cached_data keys: {list(cached_data.keys()) if isinstance(cached_data, dict) else 'N/A'}")
            
            if not cached_data:
                # Fon cache'de yok, API isteği gerekli
                print(f"❌ Fon cache'de bulunamadı: {fund_code}")
                return Response(
                    {
                        "success": True,
                        "has_price": False,
                        "needs_api_request": True,
                        "quota": quota_info,
                        "message": "Fon cache'de bulunamadı, API isteği gerekli"
                    },
                    status=status.HTTP_200_OK
                )
            
            # Cache'de fon var, fiyat bilgisini kontrol et
            # Veri yapısı: cached_data['data']['data'] içinde API response var (iç içe data)
            fund_data_wrapper = cached_data.get('data', {})
            # API response içinde bir 'data' daha var
            fund_data = fund_data_wrapper.get('data', fund_data_wrapper)  # Eğer iç içe data yoksa direkt kullan
            print(f"📦 fund_data tipi: {type(fund_data)}")
            print(f"📦 fund_data keys: {list(fund_data.keys()) if isinstance(fund_data, dict) else 'N/A'}")
            
            top_list = fund_data.get('topList', [])
            line_values = fund_data.get('lineValues', [])
            
            print(f"🔍 Fon kontrolü: {fund_code}, Tarih: {target_date}, Bugün: {today}")
            print(f"📊 topList uzunluğu: {len(top_list)}, lineValues uzunluğu: {len(line_values)}")
            if len(top_list) > 0:
                print(f"📋 topList ilk 3 örnek: {top_list[:3]}")
            if len(line_values) > 0:
                print(f"📋 lineValues ilk 3 örnek: {line_values[:3]}")
            
            # Güncel tarih için önce topList'ten fiyat al
            if target_date == today:
                print(f"📅 Bugünün tarihi seçilmiş, topList kontrol ediliyor...")
                # topList'ten "Son Fiyat (TL)" değerini bul
                son_fiyat = None
                for item in top_list:
                    if isinstance(item, dict) and item.get('key') == 'Son Fiyat (TL)':
                        try:
                            # Değeri temizle ve float'a çevir (örn: "0.399107" veya "0,399107")
                            value_str = str(item.get('value', '')).replace(',', '.').strip()
                            print(f"🔍 topList'ten bulunan değer: '{value_str}'")
                            if value_str:  # Boş string kontrolü
                                son_fiyat = float(value_str)
                                print(f"✅ topList'ten fiyat bulundu: {son_fiyat}")
                                break
                        except Exception as e:
                            print(f"⚠️ topList fiyat parse hatası: {e}")
                            continue
                
                if son_fiyat is not None:
                    return Response(
                        {
                            "success": True,
                            "has_price": True,
                            "price": son_fiyat,
                            "date": today,
                            "needs_api_request": False,
                            "quota": quota_info,
                            "source": "cache_toplist"
                        },
                        status=status.HTTP_200_OK
                    )
                
                print(f"⚠️ topList'te fiyat bulunamadı, lineValues kontrol ediliyor...")
                # topList'te bulunamadıysa, lineValues'tan bugünün tarihini kontrol et
                price_data = get_fund_price_from_line_values(line_values, target_date)
                if price_data and price_data.get('value'):
                    print(f"✅ lineValues'tan bugünün tarihi için fiyat bulundu: {price_data.get('value')}")
                    return Response(
                        {
                            "success": True,
                            "has_price": True,
                            "price": price_data.get('value'),
                            "date": price_data.get('date'),
                            "needs_api_request": False,
                            "quota": quota_info,
                            "source": "cache_linevalues"
                        },
                        status=status.HTTP_200_OK
                    )
                
                # Bugünün tarihi için lineValues'ta da yoksa, en yakın geçmiş tarihi kullan
                print(f"⚠️ Bugünün tarihi için lineValues'ta da veri yok, en yakın geçmiş tarih aranıyor...")
                # En yakın geçmiş tarihi bulmak için tüm lineValues'ı kontrol et
                if line_values and len(line_values) > 0:
                    # En son tarihi bul (en yakın geçmiş)
                    latest_date = None
                    latest_value = None
                    for item in line_values:
                        if 'date' not in item or 'value' not in item:
                            continue
                        try:
                            item_date_str = item['date']
                            if 'T' in item_date_str:
                                item_date_str = item_date_str.split('T')[0]
                            item_dt = datetime.strptime(item_date_str, '%Y-%m-%d')
                            if item_dt.date() <= datetime.strptime(today, '%Y-%m-%d').date():
                                if latest_date is None or item_dt.date() > latest_date:
                                    latest_date = item_dt.date()
                                    latest_value = item.get('value', 0)
                        except:
                            continue
                    
                    if latest_value is not None:
                        print(f"✅ En yakın geçmiş tarih bulundu: {latest_date}, fiyat: {latest_value}")
                        return Response(
                            {
                                "success": True,
                                "has_price": True,
                                "price": latest_value,
                                "date": latest_date.strftime('%Y-%m-%d'),
                                "needs_api_request": False,
                                "quota": quota_info,
                                "source": "cache_linevalues_latest"
                            },
                            status=status.HTTP_200_OK
                        )
            
            # Geçmiş tarih için lineValues'tan fiyat al
            print(f"📅 Geçmiş tarih seçilmiş ({target_date}), lineValues kontrol ediliyor...")
            price_data = get_fund_price_from_line_values(line_values, target_date)
            
            if price_data and price_data.get('value'):
                print(f"✅ lineValues'tan fiyat bulundu: {price_data.get('value')} (tarih: {price_data.get('date')})")
                return Response(
                    {
                        "success": True,
                        "has_price": True,
                        "price": price_data.get('value'),
                        "date": price_data.get('date'),
                        "needs_api_request": False,
                        "quota": quota_info,
                        "source": "cache_linevalues"
                    },
                    status=status.HTTP_200_OK
                )
            
            print(f"❌ {target_date} tarihi için fiyat bulunamadı")
            # Fiyat bulunamadı, API isteği gerekli
            return Response(
                {
                    "success": True,
                    "has_price": False,
                    "needs_api_request": True,
                    "quota": quota_info,
                    "message": f"{target_date} tarihi için fiyat bulunamadı, API isteği gerekli"
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"FundPriceCheckView hatası: {e}")
            import traceback
            print(traceback.format_exc())
            return Response(
                {
                    "success": False,
                    "error": "Sunucu hatası",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FundQuotaView(APIView):
    """
    Fon API quota bilgisini döndüren view.
    Sadece cache'den okur, API'ye istek atmaz.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Quota bilgisini döndürür (cache'den okur, istek saymaz).
        
        Returns:
            {
                "success": true,
                "quota": {
                    "remaining": 7,
                    "request_count": 3,
                    "date": "2025-11-07"
                }
            }
        """
        try:
            can_request, quota_info = can_make_fund_api_request()
            
            return Response(
                {
                    "success": True,
                    "quota": quota_info
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"FundQuotaView hatası: {e}")
            return Response(
                {
                    "success": False,
                    "error": "Sunucu hatası",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

