# Borsa API Kurulum ve Kullanım

## CollectAPI API Key Ayarlama

CollectAPI'den borsa verilerini çekmek için bir API key gereklidir.

### 1. CollectAPI Key Alma

1. [CollectAPI](https://collectapi.com) sitesine kaydolun
2. Dashboard'dan API key'inizi alın
3. `economy/hisseSenedi` endpoint'ine erişim izniniz olduğundan emin olun

### 2. Environment Variable Ayarlama

Backend `.env` dosyanıza şu satırı ekleyin:

```env
COLLECTAPI_KEY=your_api_key_here
```

Veya sistem environment variable olarak ayarlayın:

```bash
export COLLECTAPI_KEY=your_api_key_here
```

## API Endpoints

### 1. Borsa Verilerini Çek ve Firestore'a Kaydet

**Endpoint:** `GET /api/currencies/borsa/`

**Açıklama:** 
- CollectAPI'den borsa verilerini çeker
- Firestore'da `borsa` collection'ına kaydeder
- **Akıllı zaman kontrolü:** Firestore'daki `fetch_time` kontrol edilir
  - Eğer bugün için veri yoksa ve saat uygunsa → Veri çekilir
  - Eğer bugün için veri varsa ama bir sonraki fetch saatine gelmişse → Veri çekilir
  - Aksi halde Firestore'dan mevcut veri döndürülür
- Hafta sonu kontrolü yapar

**Akıllı Zaman Kontrolü:**
- Günde sadece 3 kere veri çekilir: 10:00, 13:30, 17:00
- ±5 dakika tolerans vardır
- Hafta sonları çalışmaz (borsa kapalı)
- **Otomatik kontrol:** Firestore'daki `fetch_time` kontrol edilir
  - Eğer bugün için veri yoksa ve saat uygunsa → Veri çekilir
  - Eğer bugün için veri varsa ama bir sonraki fetch saatine gelmişse → Veri çekilir
  - Aksi halde Firestore'dan mevcut veri döndürülür

**Özellikler:**
- API'den veri çekildikten sonra **direkt Firestore'a kaydedilir**
- **İstek optimizasyonu:** Aynı saatte birden fazla kullanıcı giriş yapsa bile sadece bir kez veri çekilir

**Response:**
```json
{
  "success": true,
  "data": {
    "stocks": [...],
    "timestamp": "...",
    "fetch_time": "2025-01-XX XX:XX:XX",
    "source": "CollectAPI",
    "total_count": 100
  },
  "saved_to_firestore": true,
  "date": "2025-01-XX",
  "fetch_time": "2025-01-XX XX:XX:XX"
}
```

### 2. Borsa Verilerini Getir (Akıllı Kontrol ile)

**Endpoint:** `GET /api/currencies/borsa/list/`

**Açıklama:**
- Bugün için veri isteniyorsa, otomatik olarak yeni veri çekilip çekilmeyeceğini kontrol eder
- Gerekirse yeni veri çeker, aksi halde Firestore'dan döndürür
- Geçmiş tarih için Firestore'dan veya lokal dosyadan okur

**Query Parameters:**
- `date` (opsiyonel): Tarih formatı `YYYY-MM-DD`. Yoksa bugünün tarihi kullanılır.

**Örnek:**
```bash
# Bugün için veri (otomatik kontrol yapılır)
GET /api/currencies/borsa/list/

# Belirli bir tarih için veri
GET /api/currencies/borsa/list/?date=2025-01-15
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "fetch_time": "2025-01-15 10:00:00",
    "stocks": [...],
    "last_updated": "...",
    "created_at": "..."
  },
  "date": "2025-01-15"
}
```

## Firestore Yapısı

### Collection: `borsa`

Her gün için bir doküman oluşturulur. Doküman ID'si tarih formatındadır: `YYYY-MM-DD`

**Doküman Yapısı:**
```json
{
  "date": "2025-01-15",
  "fetch_time": "2025-01-15 10:00:00",
  "timestamp": "2025-01-15T10:00:00.000000",
  "source": "CollectAPI",
  "total_count": 100,
  "last_updated": "2025-01-15T10:00:00.000000",
  "created_at": "2025-01-15T10:00:00.000000",
  "updated_at": "2025-01-15T13:30:00.000000",
  "stocks": [
    {
      "code": "AKBNK",
      "name": "Akbank T.A.Ş.",
      "current_price": 45.50,
      "change": 0.25,
      "change_percent": 0.55,
      "volume": 1000000,
      "high": 46.00,
      "low": 45.00,
      "last_update": "...",
      "time": "..."
    },
    ...
  ]
}
```

## Zamanlama (Cron Job / Scheduled Task)

Borsa verilerini otomatik olarak çekmek için bir cron job veya scheduled task kurmanız gerekir.

### Cron Job Örneği (Linux/Mac)

`crontab -e` ile crontab dosyasını düzenleyin:

```cron
# Her gün 10:00, 13:30, 17:00'de borsa verilerini çek
0 10 * * 1-5 curl -X GET http://localhost:8000/api/currencies/borsa/
30 13 * * 1-5 curl -X GET http://localhost:8000/api/currencies/borsa/
0 17 * * 1-5 curl -X GET http://localhost:8000/api/currencies/borsa/
```

**Not:** Hafta içi günler için (1-5 = Pazartesi-Cuma)

### Windows Task Scheduler

Windows'ta Task Scheduler kullanarak aynı zamanlarda çalışacak görevler oluşturabilirsiniz.

## Güvenlik Notları

1. **API Key Güvenliği:** 
   - API key'i asla kod içinde hardcode etmeyin
   - Environment variable kullanın
   - Production'da güvenli bir şekilde saklayın

2. **Firestore Güvenlik Kuralları:**
   - `borsa` collection'ı için okuma izni tüm kullanıcılara verilebilir
   - Yazma izni sadece backend'e verilmelidir

## Firestore Security Rules Örneği

```javascript
match /borsa/{date} {
  // Herkes okuyabilir (public data)
  allow read: if true;
  
  // Sadece backend yazabilir (bu kural Firebase Admin SDK ile yazma yapılacağı için)
  // Frontend'den yazma yapılmamalı
  allow write: if false;
}
```

## Test Etme

### Manuel Test

1. API key'i `.env` dosyasına ekleyin (✅ Yapıldı)
2. Backend'i çalıştırın
3. Endpoint'i çağırın (otomatik kontrol yapılır):

```bash
# Bugün için veri iste (otomatik kontrol yapılır)
curl -X GET http://localhost:8000/api/currencies/borsa/list/
```

**Akıllı Kontrol Senaryoları:**

**Senaryo 1:** Saat 09:00, bugün için veri yok
- Sonuç: Veri çekilmez (saat uygun değil), önceki günün verisi döndürülür

**Senaryo 2:** Saat 11:00, bugün için veri yok
- Sonuç: Veri çekilir (10:00 geçmiş, bugün için veri yok)

**Senaryo 3:** Saat 11:30, bugün 11:00'da veri çekilmiş
- Sonuç: Veri çekilmez (13:30 henüz gelmedi), mevcut veri döndürülür

**Senaryo 4:** Saat 13:35, bugün 11:00'da veri çekilmiş
- Sonuç: Veri çekilir (13:30 geçmiş, bir sonraki fetch saati)

4. Firestore'da `borsa` collection'ını kontrol edin

## Hata Ayıklama

### API Key Hatası
```
❌ CollectAPI API Key bulunamadı!
```
**Çözüm:** `.env` dosyasında `COLLECTAPI_KEY` değişkenini kontrol edin.

### Zamanlama Hatası
```
⏰ Şu anki saat (14:30) veri çekme saatlerinden biri değil
```
**Çözüm:** Bu normaldir. Sadece belirtilen saatlerde çalışır.

### Firestore Hatası
```
❌ Firestore'a kaydetme hatası
```
**Çözüm:** Firebase credentials ve Firestore bağlantısını kontrol edin.

