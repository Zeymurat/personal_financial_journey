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
import threading

from .tcmb_service import get_tcmb_service
from .borsa_service import get_borsa_service

logger = logging.getLogger(__name__)

# Borsa veri çekme için lock (aynı anda 2 istek atılmasını engellemek için)
_borsa_fetch_lock = threading.Lock()
_borsa_fetching = False


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


def get_currencies_metadata_from_file() -> dict:
    """
    currencies.json dosyasından metadata bilgisini okur (fetch_time vb.)
    
    Returns:
        Metadata dict'i veya None
    """
    file_path = get_json_file_path('currencies.json')
    
    if not os.path.exists(file_path):
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Eski format: direkt veri yapısı (metadata root level'da)
        if isinstance(data, dict) and 'metadata' in data:
            return data['metadata']
        
        # Yeni format: tarih bazlı (metadata root level'da veya tarih key'i içinde)
        today = datetime.now().strftime('%Y-%m-%d')
        if today in data and isinstance(data[today], dict):
            # Tarih key'i içindeki metadata'yı kontrol et
            if 'metadata' in data[today]:
                return data[today]['metadata']
            # Veya root level'daki metadata'yı kontrol et
            if 'metadata' in data:
                return data['metadata']
        
        return None
    except Exception:
        return None


def read_currencies_from_file(date: str = None) -> dict:
    """
    currencies.json dosyasından döviz kurlarını okur.
    
    Args:
        date: Tarih (YYYY-MM-DD formatında). None ise bugünün tarihi kullanılır.
    
    Returns:
        {
            'exchange_rates': {...},
            'gold_prices': {...},
            'crypto_currencies': {...},
            'precious_metals': {...},
            'metadata': {...}
        } veya None
    """
    if date is None:
        date = datetime.now().strftime('%Y-%m-%d')
    
    file_path = get_json_file_path('currencies.json')
    
    if not os.path.exists(file_path):
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Eski format kontrolü (direkt veri yapısı)
        if 'exchange_rates' in data or 'metadata' in data:
            # Eski format: direkt veri yapısı
            # Bugünün verisi olarak kabul et
            today = datetime.now().strftime('%Y-%m-%d')
            if date == today:
                return data
            else:
                logger.debug(f"💱 Döviz: Eski format dosya var ama istenen tarih ({date}) bugün değil")
                return None
        
        # Yeni format: tarih bazlı
        if isinstance(data, dict):
            # metadata key'ini atla
            available_dates = [k for k in data.keys() if k != 'metadata' and isinstance(data[k], dict)]
            
            if date in data:
                date_data = data[date]
                
                # Veri boş mu kontrol et - dict'lerin boş olup olmadığını kontrol et
                if not date_data or not isinstance(date_data, dict):
                    logger.warning(f"💱 Döviz: Dosyada {date} tarihi var ama date_data dict değil veya boş")
                    return None
                
                exchange_rates = date_data.get('exchange_rates', {})
                gold_prices = date_data.get('gold_prices', {})
                crypto_currencies = date_data.get('crypto_currencies', {})
                precious_metals = date_data.get('precious_metals', {})
                
                # Dict'lerin boş olup olmadığını kontrol et
                has_exchange = isinstance(exchange_rates, dict) and len(exchange_rates) > 0
                has_gold = isinstance(gold_prices, dict) and len(gold_prices) > 0
                has_crypto = isinstance(crypto_currencies, dict) and len(crypto_currencies) > 0
                has_metals = isinstance(precious_metals, dict) and len(precious_metals) > 0
                
                if not (has_exchange or has_gold or has_crypto or has_metals):
                    logger.warning(f"💱 Döviz: Dosyada {date} tarihi var ama tüm veriler boş (exchange: {has_exchange}, gold: {has_gold}, crypto: {has_crypto}, metals: {has_metals})")
                    return None
                
                logger.debug(f"💱 Döviz: Dosyadan {date} tarihi okundu (exchange: {len(exchange_rates) if has_exchange else 0}, gold: {len(gold_prices) if has_gold else 0}, crypto: {len(crypto_currencies) if has_crypto else 0}, metals: {len(precious_metals) if has_metals else 0})")
                return date_data
            else:
                # İstenen tarih yoksa, en yakın tarihi bul (en yeni)
                if available_dates:
                    # Tarihleri sırala (en yeni önce)
                    sorted_dates = sorted(available_dates, reverse=True)
                    logger.info(f"💱 Döviz: Dosyada {date} tarihi yok. Mevcut tarihler: {sorted_dates[:5]}")
                    # En yeni tarihi döndür
                    latest_date = sorted_dates[0]
                    logger.info(f"💱 Döviz: En yeni tarih kullanılıyor: {latest_date}")
                    return data[latest_date]
                else:
                    logger.warning(f"💱 Döviz: Dosyada hiç tarih yok")
                    return None
        else:
            logger.warning(f"💱 Döviz: Dosya formatı beklenen gibi değil (dict değil)")
            return None
    except json.JSONDecodeError as e:
        logger.error(f"💱 Döviz: JSON parse hatası ({file_path}): {e}")
        return None
    except Exception as e:
        logger.error(f"💱 Döviz: Dosya okuma hatası ({file_path}): {e}", exc_info=True)
        return None


def write_currencies_to_file(data: dict, date: str = None) -> bool:
    """
    Döviz kurlarını currencies.json dosyasına yazar.
    funds.json ile TAM AYNI dizine yazar.
    Borsa gibi tarih bazlı yapı kullanır.
    
    Args:
        data: {
            'exchange_rates': {...},
            'gold_prices': {...},
            'crypto_currencies': {...},
            'precious_metals': {...},
            'metadata': {...}
        }
        date: Tarih (YYYY-MM-DD formatında). None ise bugünün tarihi kullanılır.
    
    Returns:
        True if successful, False otherwise
    """
    if date is None:
        date = datetime.now().strftime('%Y-%m-%d')
    
    file_path = get_json_file_path('currencies.json')
    
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
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Eğer bugünün verisi yazılıyorsa, eski tarihleri temizle (sadece bugünü tut)
    if date == today:
        # Sadece bugünün verisini ve metadata'yı tut
        existing_data = {
            date: data,
            'metadata': {
                'fetch_time': data.get('metadata', {}).get('fetch_time'),
                'date': date,
                'last_updated': datetime.now().isoformat()
            }
        }
    else:
        # Geçmiş tarih için ekle (ama metadata'yı güncelleme)
        existing_data[date] = data
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
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
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Eğer data bir dict ise ve 'data' key'i varsa, o tarih için veri ara
        if isinstance(data, dict):
            if date in data:
                return data[date]
            else:
                return None
        else:
            return None
    except Exception:
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
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Eğer bugünün verisi yazılıyorsa, eski tarihleri temizle (sadece bugünü tut)
    if date == today:
        # Sadece bugünün verisini ve metadata'yı tut
        existing_data = {
            date: borsa_data,
            'metadata': {
                'fetch_time': borsa_data.get('fetch_time'),
                'date': date,
                'last_updated': datetime.now().isoformat()
            }
        }
    else:
        # Geçmiş tarih için ekle (ama metadata'yı güncelleme)
        existing_data[date] = borsa_data
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
        return True
    except Exception:
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
    except Exception:
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
    except Exception:
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
        return True
    except Exception:
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
    except Exception:
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
        return True
    except Exception:
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
        except Exception:
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
                    return False, cached_data
                
                # Eğer lineValues'ın son tarihi dünden eski ise → Yeni veri çek
                if last_date < yesterday_date:
                    can_request, quota_info = can_make_fund_api_request()
                    if not can_request:
                        return False, cached_data
                    return True, cached_data
                
                # Eğer lineValues'ın son tarihi bugün veya bugünden yeni ise → Cache'den oku
                return False, cached_data
            except Exception:
                return False, cached_data
        
        # lineValues yok veya boş, bugün çekilmişse cache'den oku
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
                return False, cached_data
            
            # Eğer lineValues'ın son tarihi dünden eskiyse, yeni veri çek
            can_request, quota_info = can_make_fund_api_request()
            if not can_request:
                return False, cached_data
            return True, cached_data
        except Exception:
            return False, cached_data
    
    # lineValues yok veya boş, yeni veri çek
    can_request, quota_info = can_make_fund_api_request()
    if not can_request:
        return False, cached_data
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
            service = get_tcmb_service()
            today = datetime.now().strftime('%Y-%m-%d')
            current_time = datetime.now().strftime('%H:%M')
            
            # Local dosyadan bugünün verisini kontrol et
            existing_fetch_time = None
            file_exists = False
            try:
                file_path = get_json_file_path('currencies.json')
                file_exists = os.path.exists(file_path)
                
                if file_exists:
                    metadata = get_currencies_metadata_from_file()
                    if metadata and metadata.get('fetch_time'):
                        existing_fetch_time = metadata.get('fetch_time')
            except Exception:
                pass
            
            # Yeni veri çekilmeli mi?
            if not file_exists:
                should_fetch = True
                logger.info(f"💱 Döviz: Cache dosyası yok, API'den çekilecek")
            else:
                try:
                    should_fetch = service.should_fetch_new_data(existing_fetch_time)
                    if should_fetch:
                        logger.info(
                            f"💱 Döviz: Yeni veri çekilecek "
                            f"(son çekim: {existing_fetch_time}, şu an: {current_time})"
                        )
                    else:
                        logger.info(
                            f"💱 Döviz: Cache kullanılacak "
                            f"(son çekim: {existing_fetch_time}, şu an: {current_time})"
                        )
                except Exception as e:
                    should_fetch = False
                    logger.warning(f"💱 Döviz: Saat kontrolü hatası, cache kullanılacak: {e}")
            
            if not should_fetch:
                # Local dosyadan mevcut veriyi döndür
                try:
                    file_data = read_currencies_from_file(today)
                    
                    # Bugünün verisi yoksa, dünün verisini dene
                    if not file_data:
                        from datetime import timedelta
                        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                        file_data = read_currencies_from_file(yesterday)
                        if not file_data:
                            raise Exception("Local dosyada veri yok, API'den çekilecek")
                    
                    exchange_rates = file_data.get('exchange_rates', {})
                    gold_prices = file_data.get('gold_prices', {})
                    crypto_currencies = file_data.get('crypto_currencies', {})
                    precious_metals = file_data.get('precious_metals', {})
                    metadata = file_data.get('metadata', {})
                    
                    # Eğer veri yoksa veya boşsa, API'den çekmeyi dene
                    if not exchange_rates and not gold_prices and not crypto_currencies:
                        raise Exception("Local dosyada veri yok, API'den çekilecek")
                    
                    # Veri varsa, döndür
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
                        "date": date,
                        "source": "local_file",
                        "cached": True,
                        "message": "Mevcut veri kullanılıyor" if date == today else f"Bugünün verisi henüz yok, dünün verisi gösteriliyor ({date})",
                        "warning": None if date == today else f"Bugünün verisi henüz yok, dünün verisi gösteriliyor ({date})"
                    }
                    print(f"💱 Döviz verileri (kaynak: cache)")
                    return Response(response_data, status=status.HTTP_200_OK)
                except Exception:
                    pass
            
            # API'den veri çek
            api_error = None
            try:
                data = service.get_formatted_rates()
            except Exception as e:
                api_error = str(e)
                logger.error(f"💱 Döviz API hatası: {api_error}", exc_info=True)
                data = None
            
            if data is None:
                # API'den veri alınamadıysa, dosyadan en yeni veriyi oku (tarih kontrolü yapma)
                file_error_msg = None
                try:
                    logger.info(f"💱 Döviz: API başarısız, local dosyadan okunuyor")
                    
                    # Dosyadan tüm veriyi oku ve en yeni tarihi bul
                    file_path = get_json_file_path('currencies.json')
                    if not os.path.exists(file_path):
                        file_error_msg = "Local dosya bulunamadı"
                        logger.warning(f"💱 Döviz: {file_error_msg}")
                    else:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            all_data = json.load(f)
                        
                        # En yeni tarihi bul (metadata hariç)
                        available_dates = [k for k in all_data.keys() if k != 'metadata' and isinstance(all_data[k], dict)]
                        
                        if not available_dates:
                            file_error_msg = "Local dosyada hiç tarih yok"
                            logger.warning(f"💱 Döviz: {file_error_msg}")
                        else:
                            # En yeni tarihi al
                            sorted_dates = sorted(available_dates, reverse=True)
                            latest_date = sorted_dates[0]
                            file_data = all_data[latest_date]
                            
                            logger.info(f"💱 Döviz: Dosyadan en yeni tarih okundu: {latest_date}")
                            
                            exchange_rates = file_data.get('exchange_rates', {})
                            gold_prices = file_data.get('gold_prices', {})
                            crypto_currencies = file_data.get('crypto_currencies', {})
                            precious_metals = file_data.get('precious_metals', {})
                            metadata = file_data.get('metadata', {})
                            
                            # Veri kontrolü - dict'lerin boş olup olmadığını kontrol et
                            has_exchange = isinstance(exchange_rates, dict) and len(exchange_rates) > 0
                            has_gold = isinstance(gold_prices, dict) and len(gold_prices) > 0
                            has_crypto = isinstance(crypto_currencies, dict) and len(crypto_currencies) > 0
                            has_metals = isinstance(precious_metals, dict) and len(precious_metals) > 0
                            has_data = has_exchange or has_gold or has_crypto or has_metals
                            
                            if has_data:
                                date = metadata.get('date', latest_date)
                                formatted_data = {
                                    'exchange_rates': exchange_rates,
                                    'gold_prices': gold_prices,
                                    'crypto_currencies': crypto_currencies,
                                    'precious_metals': precious_metals,
                                    'last_updated': metadata.get('last_updated', datetime.now().isoformat()),
                                    'date': date,
                                    'date_en': metadata.get('date_en', '')
                                }
                                
                                logger.warning(f"💱 Döviz: API hatası nedeniyle cache kullanılıyor (API hatası: {api_error}, Tarih: {date})")
                                print(f"💱 Döviz verileri (kaynak: cache, tarih: {date})")
                                return Response(
                                    {
                                        "success": True,
                                        "data": formatted_data,
                                        "date": date,
                                        "source": "local_file",
                                        "cached": True,
                                        "warning": "Yeni veri çekilemedi, mevcut veri kullanılıyor"
                                    },
                                    status=status.HTTP_200_OK
                                )
                            else:
                                file_error_msg = f"Local dosyada {latest_date} tarihi var ama veriler boş"
                                logger.warning(f"💱 Döviz: {file_error_msg}")
                except Exception as file_error:
                    file_error_msg = f"Local dosya okuma hatası: {str(file_error)}"
                    logger.error(f"💱 Döviz: {file_error_msg}", exc_info=True)
                
                # Hem API hem de local dosya başarısız oldu
                error_message = "Finans API servisinden veri alınamadı"
                if api_error:
                    error_message += f" (API hatası: {api_error})"
                if file_error_msg:
                    error_message += f" | {file_error_msg}"
                
                logger.error(f"💱 Döviz: 503 hatası - {error_message}")
                return Response(
                    {
                        "success": False,
                        "error": error_message,
                        "message": "Finans API'sine erişilemedi ve local cache'den de veri okunamadı. Lütfen daha sonra tekrar deneyin.",
                        "api_error": api_error if api_error else None,
                        "file_error": file_error_msg if file_error_msg else None
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Local dosyaya kaydet
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
                
                write_currencies_to_file(file_data, today)
            except Exception as file_error:
                logger.error(f"Local dosyaya kaydetme hatası: {file_error}", exc_info=True)
            
            # Response döndür
            response_data = {
                "success": True,
                "data": {
                    'exchange_rates': data.get('exchange_rates', {}),
                    'gold_prices': data.get('gold_prices', {}),
                    'crypto_currencies': data.get('crypto_currencies', {}),
                    'precious_metals': data.get('precious_metals', {}),
                    'last_updated': data.get('timestamp', datetime.now().isoformat()),
                    'date': data.get('date', today),
                    'date_en': data.get('date_en', '')
                },
                "date": data.get('date', today),
                "source": "api",
                "cached": False
            }
            print(f"💱 Döviz verileri (kaynak: api)")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"GetMainDataView hatası: {e}", exc_info=True)
            response_data = {
                "error": "Sunucu hatası",
                "message": str(e)
            }
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
            service = get_borsa_service()
            today = datetime.now().strftime('%Y-%m-%d')
            current_time = datetime.now().strftime('%H:%M')
            
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
            except Exception:
                pass
            
            # Yeni veri çekilmeli mi?
            if not file_exists:
                should_fetch = True
                logger.info(f"📈 Borsa: Cache dosyası yok, API'den çekilecek")
            else:
                should_fetch = service.should_fetch_new_data(existing_fetch_time)
                if should_fetch:
                    logger.info(
                        f"📈 Borsa: Yeni veri çekilecek "
                        f"(son çekim: {existing_fetch_time}, şu an: {current_time})"
                    )
                else:
                    logger.info(
                        f"📈 Borsa: Cache kullanılacak "
                        f"(son çekim: {existing_fetch_time}, şu an: {current_time})"
                    )
            
            if not should_fetch:
                # Local dosyadan mevcut veriyi döndür veya dünün verisini dene
                if existing_fetch_time:
                    try:
                        borsa_data = read_borsa_from_file(today)
                        if borsa_data:
                            print(f"📈 Hisse verileri (kaynak: cache)")
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
                    except Exception:
                        pass
                
                # Bugünün verisi yoksa, dünün verisini dene (dövizlerdeki gibi)
                if not existing_fetch_time:
                    from datetime import timedelta
                    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                    try:
                        borsa_data = read_borsa_from_file(yesterday)
                        if borsa_data:
                            print(f"📈 Hisse verileri (kaynak: cache)")
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
                    except Exception:
                        pass
                
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
                return Response(
                    {
                        "success": False,
                        "message": "Bugün hafta sonu, borsa kapalı"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # API'den veri çek
            borsa_data = service.get_borsa_data()
            
            if borsa_data is None:
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
                
                write_borsa_to_file(stock_data, today)
                print(f"📈 Hisse verileri (kaynak: api, adet: {len(borsa_data.get('stocks', []))})")
                
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
                
            except Exception as file_error:
                logger.error(f"Local dosyaya kaydetme hatası: {file_error}")
                print(f"📈 Hisse verileri (kaynak: api, adet: {len(borsa_data.get('stocks', []))})")
                
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
                        pass
                except Exception as e:
                    logger.warning(f"Local dosya kontrol hatası: {e}")
                
                # Yeni veri çekilmeli mi?
                # Eğer dosya yoksa, ilk kez çalıştırılıyor demektir - her zaman API'den çek
                if not file_exists:
                    should_fetch = True
                else:
                    should_fetch = service.should_fetch_new_data(existing_fetch_time)
                
                if should_fetch:
                    # Aynı anda 2 istek atılmasını engelle (lock mekanizması)
                    global _borsa_fetching
                    
                    with _borsa_fetch_lock:
                        # Eğer başka bir thread zaten veri çekiyorsa, bekle veya mevcut veriyi döndür
                        if _borsa_fetching:
                            borsa_data = read_borsa_from_file(today)
                            if borsa_data:
                                return Response(
                                    {
                                        "success": True,
                                        "data": borsa_data,
                                        "date": today,
                                        "source": "local_file",
                                        "cached": True,
                                        "warning": "Veri çekiliyor, mevcut veri gösteriliyor"
                                    },
                                    status=status.HTTP_200_OK
                                )
                        
                        _borsa_fetching = True
                    
                    try:
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
                    finally:
                        with _borsa_fetch_lock:
                            _borsa_fetching = False
            
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
                return Response(response_data, status=status.HTTP_200_OK)
            
            # Bugünün verisi yoksa, dünün verisini dene (dövizlerdeki gibi)
            if target_date == today:
                from datetime import timedelta
                yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
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
                return Response(
                    {
                        "success": False,
                        "error": "Funds JSON dosyası bulunamadı"
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
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
                
            except json.JSONDecodeError as e:
                return Response(
                    {
                        "success": False,
                        "error": "JSON dosyası parse edilemedi",
                        "message": str(e)
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except Exception as e:
                raise  # Hataları yukarı fırlat
            
            response_data = {
                "success": True,
                "data": {
                    "funds": funds_list,
                    "total_count": len(funds_list)
                },
                "source": "json_file"
            }
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
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
            
            # Akıllı cache kontrolü
            should_fetch, cached_data = should_fetch_fund_detail_from_api(fund_code, target_date)
            
            # Quota bilgisini al
            can_request, quota_info = can_make_fund_api_request()
            
            if should_fetch:
                # API'den çek
                if not can_request:
                    # Quota yok, cache'deki eski veriyi döndür (varsa)
                    if cached_data:
                        print(f"💰 Funds verileri (kaynak: cache)")
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
                rapidapi_key = os.getenv('RAPIDAPI_KEY', '').strip()
                if not rapidapi_key:
                    return Response(
                        {
                            "success": False,
                            "error": "RAPIDAPI_KEY tanımlı değil",
                            "message": "Sunucu yapılandırma hatası: RAPIDAPI_KEY bulunamadı."
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                url = f"https://tefas-api.p.rapidapi.com/api/v1/funds/{fund_code}"
                headers = {
                    'x-rapidapi-host': 'tefas-api.p.rapidapi.com',
                    'x-rapidapi-key': rapidapi_key
                }
                
                try:
                    response = requests.get(url, headers=headers, timeout=30)
                    response.raise_for_status()
                    api_data = response.json()
                    
                    # Cache'e kaydet
                    write_fund_detail_to_cache(fund_code, api_data)
                    
                    # Quota'yı artır
                    updated_quota = increment_fund_api_quota()
                    
                    print(f"💰 Funds verileri (kaynak: api)")
                    
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
                except requests.exceptions.RequestException:
                    # Hata durumunda cache'deki veriyi döndür (varsa)
                    if cached_data:
                        print(f"💰 Funds verileri (kaynak: cache)")
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
                print(f"💰 Funds verileri (kaynak: cache)")
                
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
            logger.error(f"FundDetailView hatası: {e}")
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
            
            if not cached_data:
                # Fon cache'de yok, API isteği gerekli
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
            
            top_list = fund_data.get('topList', [])
            line_values = fund_data.get('lineValues', [])
            
            # fetchTime'ı al (lastFetchDate veya fetchTime'dan)
            fetch_time_str = cached_data.get('fetchTime') or cached_data.get('lastFetchDate')
            fetch_time_date = None
            if fetch_time_str:
                try:
                    # fetchTime formatı: "2025-11-07T01:41:41.779478" veya "2025-11-07"
                    if 'T' in fetch_time_str:
                        fetch_time_date = datetime.strptime(fetch_time_str.split('T')[0], '%Y-%m-%d').date()
                    else:
                        fetch_time_date = datetime.strptime(fetch_time_str, '%Y-%m-%d').date()
                except:
                    pass
            
            target_date_obj = datetime.strptime(target_date, '%Y-%m-%d').date()
            today_obj = datetime.strptime(today, '%Y-%m-%d').date()
            
            # Bugün için kontrol (target_date == today)
            if target_date == today:
                # fetchTime bugünden önceyse → API isteği gerekli
                if fetch_time_date and fetch_time_date < today_obj:
                    return Response(
                        {
                            "success": True,
                            "has_price": False,
                            "needs_api_request": True,
                            "quota": quota_info,
                            "message": "Güncel veri bulunamadı, API isteği gerekli"
                        },
                        status=status.HTTP_200_OK
                    )
                
                # fetchTime bugün veya sonrasıysa → topList'ten "Son Fiyat" al
                son_fiyat = None
                for item in top_list:
                    if isinstance(item, dict) and item.get('key') == 'Son Fiyat (TL)':
                        try:
                            value_str = str(item.get('value', '')).replace(',', '.').strip()
                            if value_str:
                                son_fiyat = float(value_str)
                                break
                        except:
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
                
                # topList'te bulunamadıysa, lineValues'tan bugünün tarihini kontrol et
                price_data = get_fund_price_from_line_values(line_values, target_date)
                if price_data and price_data.get('value'):
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
                
                # Bugünün tarihi için lineValues'ta da yoksa, API isteği gerekli
                return Response(
                    {
                        "success": True,
                        "has_price": False,
                        "needs_api_request": True,
                        "quota": quota_info,
                        "message": "Güncel veri bulunamadı, API isteği gerekli"
                    },
                    status=status.HTTP_200_OK
                )
            
            # Geçmiş tarih için kontrol (target_date < today)
            if target_date < today:
                # Eğer target_date == fetchTime ise, topList'ten kontrol et
                if fetch_time_date and fetch_time_date == target_date_obj:
                    # topList'ten "Son Fiyat (TL)" değerini bul
                    son_fiyat = None
                    for item in top_list:
                        if isinstance(item, dict) and item.get('key') == 'Son Fiyat (TL)':
                            try:
                                value_str = str(item.get('value', '')).replace(',', '.').strip()
                                if value_str:
                                    son_fiyat = float(value_str)
                                    break
                            except:
                                continue
                    
                    if son_fiyat is not None:
                        return Response(
                            {
                                "success": True,
                                "has_price": True,
                                "price": son_fiyat,
                                "date": target_date,
                                "needs_api_request": False,
                                "quota": quota_info,
                                "source": "cache_toplist"
                            },
                            status=status.HTTP_200_OK
                        )
                
                # ÖNCE lineValues'tan kontrol et (fetchTime'dan bağımsız)
                # Eğer lineValues'ta varsa, kullanılabilir (eski çekimlerden olabilir)
                price_data = get_fund_price_from_line_values(line_values, target_date)
                
                # Dönen tarihin tam eşleşip eşleşmediğini kontrol et
                if price_data and price_data.get('value'):
                    price_date_str = price_data.get('date', '')
                    # Tarih formatını normalize et
                    if 'T' in price_date_str:
                        price_date_str = price_date_str.split('T')[0]
                    
                    # Tam tarih eşleşmesi varsa fiyatı döndür
                    if price_date_str == target_date:
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
                    # Tam tarih eşleşmesi yoksa, fetchTime kontrolü yap
                
                # Tam tarih bulunamadı, fetchTime kontrolü yap
                # fetchTime > girilen tarih → "Bu tarihte veri yok" mesajı, API isteği gerekmez
                if fetch_time_date and fetch_time_date > target_date_obj:
                    return Response(
                        {
                            "success": True,
                            "has_price": False,
                            "needs_api_request": False,
                            "quota": quota_info,
                            "message": f"{target_date} tarihi için veri bulunamadı. Bu tarih, veri çekim tarihinden ({fetch_time_date.strftime('%Y-%m-%d')}) önce."
                        },
                        status=status.HTTP_200_OK
                    )
                
                # fetchTime < girilen tarih → Bu tarih için veri henüz çekilmemiş, API isteği gerekli
                if fetch_time_date and fetch_time_date < target_date_obj:
                    return Response(
                        {
                            "success": True,
                            "has_price": False,
                            "needs_api_request": True,
                            "quota": quota_info,
                            "message": f"{target_date} tarihi için güncel veri bulunamadı. Bu tarih, son veri çekim tarihinden ({fetch_time_date.strftime('%Y-%m-%d')}) sonra. API isteği gerekli."
                        },
                        status=status.HTTP_200_OK
                    )
                
                # fetchTime bilgisi yoksa → API isteği gerekli
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
            
            # Gelecek tarih için (target_date > today) → API isteği gerekli
            return Response(
                {
                    "success": True,
                    "has_price": False,
                    "needs_api_request": True,
                    "quota": quota_info,
                    "message": "Gelecek tarih için veri bulunamaz, API isteği gerekli"
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"FundPriceCheckView hatası: {e}", exc_info=True)
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

