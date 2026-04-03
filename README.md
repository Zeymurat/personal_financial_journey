# Finance - Kişisel Finans Takip Uygulaması

React + TypeScript frontend ve Django REST backend ile geliştirilmiş, Firebase Authentication + Firestore tabanlı kişisel finans takip uygulaması.

Bu README, projeyi GitHub'dan indiren bir geliştiricinin sıfırdan kurup ayağa kaldırabilmesi için hazırlanmıştır.

---

## İçindekiler

- [Projenin Amacı](#projenin-amacı)
- [Temel Özellikler](#temel-özellikler)
- [Mimari ve Teknolojiler](#mimari-ve-teknolojiler)
- [Harici API Kaynakları](#harici-api-kaynakları)
- [Firebase Neden Tercih Edildi](#firebase-neden-tercih-edildi)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Detaylı Kurulum](#detaylı-kurulum)
- [Environment Değişkenleri](#environment-değişkenleri)
- [Firestore Rules](#firestore-rules)
- [API Endpoint Özeti](#api-endpoint-özeti)
- [Proje Yapısı](#proje-yapısı)
- [Build ve Çalıştırma Komutları](#build-ve-çalıştırma-komutları)
- [Yayın Öncesi Kontrol Listesi](#yayın-öncesi-kontrol-listesi)
- [Sorun Giderme](#sorun-giderme)

---

## Projenin Amacı

Bu uygulama, kullanıcıların:

- gelir/gider işlemlerini takip etmesini,
- yatırımlarını (hisse, fon, döviz, altın, kripto vb.) yönetmesini,
- raporlar ve dashboard üzerinden finansal durumunu analiz etmesini,
- çoklu dil desteği ile uygulamayı farklı dillerde kullanmasını

hedefler.

---

## Temel Özellikler

- Firebase Authentication ile kullanıcı girişi/kayıt
- Firestore üzerinde kullanıcı bazlı veri izolasyonu
- Gelir-gider yönetimi (CRUD)
- Hızlı işlem kartları (quick actions)
- Yatırım portföy takibi ve işlem geçmişi
- Döviz/altın/kripto/borsa/fon verisi gösterimi
- Ajanda (etkinlik) ve bildirim yönetimi
- i18n çoklu dil desteği (`tr`, `en`, `de`, `fr`, `es`)
- Karanlık/aydınlık tema

---

## Mimari ve Teknolojiler

### Frontend (`frontend/`)

- React `18.3.1`
- TypeScript `5.5.3`
- Vite `5.4.2`
- TailwindCSS `3.4.1`
- Firebase Web SDK `12.1.0`
- i18next + react-i18next
- @dnd-kit (drag & drop)
- react-hot-toast

### Backend (`finance_backend/`)

- Python + Django `3.2.25`
- Django REST Framework `3.14.0`
- Firebase Admin SDK `6.4.0`
- google-cloud-firestore `2.13.1`
- django-cors-headers `4.3.1`
- python-dotenv `1.0.0`
- zeep `4.1.0`

### Veri Katmanı

- Ana veritabanı: **Google Cloud Firestore**
- Kimlik doğrulama: **Firebase Authentication**

---

## Harici API Kaynakları

Backend `currencies` modülü şu kaynaklardan veri alır:

- Finans API (döviz/altın/kripto):  
  [`https://finans.truncgil.com/v4/today.json`](https://finans.truncgil.com/v4/today.json)
- CollectAPI (borsa verisi):  
  [`https://api.collectapi.com/economy/hisseSenedi`](https://api.collectapi.com/economy/hisseSenedi)
- TEFAS RapidAPI (fon detayları):  
  `https://tefas-api.p.rapidapi.com/...` (backend tarafında kullanılıyor)

Not: Fon detay istekleri için günlük kota/cache mekanizması bulunur (`fund_api_quota.json`, `fundsDetails.json`).

---

## Firebase Neden Tercih Edildi

Bu projede Firebase tercihinin ana sebepleri:

- **Hızlı kimlik doğrulama**: Email/Password + provider login akışı
- **NoSQL esneklik**: kullanıcı bazlı hiyerarşik koleksiyon yapısı
- **Realtime/read-heavy kullanım senaryolarına uygunluk**
- **Frontend + backend birlikte güvenli kullanım**:
  - frontend: Firebase Auth + Firestore SDK
  - backend: Firebase Admin SDK ile doğrulama/yetkilendirme
- **MVP ve ürün geliştirme hızını artırması**

---

## Hızlı Başlangıç

```bash
# 1) Repoyu klonla
git clone <REPO_URL>
cd finance

# 2) Frontend bağımlılıkları
cd frontend
npm install

# 3) Backend bağımlılıkları
cd ../finance_backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate
pip install -r requirements.txt

# 4) Kök dizinde .env oluştur (aşağıdaki örneğe göre)
# 5) Backend
python manage.py runserver

# 6) Yeni terminalde frontend
cd ../frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

---

## Detaylı Kurulum

### 1) Firebase projesi oluştur

1. Firebase Console'da yeni proje aç.
2. Authentication bölümünde en az Email/Password provider'ı aktif et.
3. Firestore Database oluştur.
4. Service Account JSON anahtarını indir.

### 2) Service Account JSON'u `.env` içine koy

Backend, `FIREBASE_CREDENTIALS_JSON` bekliyor.  
JSON içeriğini tek satır string olarak ver.

### 3) Firestore Rules uygula

Aşağıdaki [Firestore Rules](#firestore-rules) bölümündeki kuralları Firebase Console > Firestore > Rules ekranına yapıştır.

### 4) API anahtarlarını tamamla

- `COLLECTAPI_KEY` (borsa servisi için gerekli)
- TEFAS RapidAPI anahtarı için mevcut backend implementasyonunu gözden geçir (aşağıdaki güvenlik notuna bak)

---

## Environment Değişkenleri

Kök dizinde (`finance/.env`) örnek:

```env
# Django
DJANGO_SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Firebase Admin (Backend)
FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}

# Firebase Client (Frontend - Vite)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# External APIs
COLLECTAPI_KEY=...
RAPIDAPI_KEY=...
```

> Not: Frontend Firebase değişkenleri `frontend/src/firebase.ts` içinde `import.meta.env.*` ile okunur.

### Güvenlik Notu (Önemli)

TEFAS RapidAPI anahtarı backend'de `RAPIDAPI_KEY` environment variable'ından okunur.  
Anahtarı kesinlikle kod içine yazma; `.env` kullan ve anahtarın daha önce açığa çıktıysa rotate et.

---

## Firestore Rules

Bu proje için önerilen rules:

```javascript
rules_version = '2';

service cloud.firestore {

  match /databases/{database}/documents {

    // ============================================
    // ROOT LEVEL COLLECTIONS
    // ============================================

    // Global döviz kurları - Tüm authenticated kullanıcılar okuyup yazabilir
    // TCMB API'den güncelleme için gerekli
    match /currencies/{currencyCode} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Eski exchange_rates collection'ı (backward compatibility)
    match /exchange_rates/{rateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // ============================================
    // USER-SPECIFIC COLLECTIONS
    // ============================================

    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;

      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /events/{eventId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /notifications/{notificationId} {
        allow read, delete: if request.auth != null && request.auth.uid == userId;
      }

      match /investments/{investmentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        match /transactions/{transactionId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      match /quickTransactions/{quickTransactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /quickInvestments/{quickInvestmentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /settings/user_settings {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /selectedCurrency/{currencyCode} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /selectedHisse/{hisseCode} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /quickConvert/{conversionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /selectedFund/{fundKey} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /followedFund/{fundKey} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /followedCurrency/{currencyCode} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /followedHisse/{hisseCode} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## API Endpoint Özeti

### Backend base URL

- `http://localhost:8000/api/auth`
- `http://localhost:8000/api/currencies`

### Auth / User Data

- `POST /api/auth/firebase-login/`
- `GET|POST /api/auth/transactions/`
- `PUT|DELETE /api/auth/transactions/{id}/`
- `GET|POST /api/auth/quick-transactions/`
- `PUT|DELETE /api/auth/quick-transactions/{id}/`
- `GET|POST /api/auth/investments/`
- `PUT|DELETE /api/auth/investments/{id}/`
- `GET|POST /api/auth/investments/{id}/transactions/`
- `PUT|DELETE /api/auth/investments/{id}/transactions/{txId}/`
- `GET|PUT /api/auth/settings/`
- `GET|POST /api/auth/notifications/`
- `POST /api/auth/notifications/read-all/`
- `DELETE /api/auth/notifications/delete-read/`
- `PUT|DELETE /api/auth/notifications/{id}/`
- `GET|POST /api/auth/events/`
- `PUT|DELETE /api/auth/events/{id}/`

### Currency / Market Data

- `GET /api/currencies/getmain/`
- `GET /api/currencies/exchange-rates/`
- `GET /api/currencies/gold-prices/`
- `GET /api/currencies/borsa/`
- `GET /api/currencies/borsa/list/`
- `GET /api/currencies/funds/`
- `GET /api/currencies/fund-detail/?fund_code=XXX`
- `GET /api/currencies/fund-quota/`
- `GET /api/currencies/fund-price-check/?fund_code=XXX&date=YYYY-MM-DD`

---

## Proje Yapısı

```text
finance/
├─ frontend/                 # React + TypeScript + Vite
│  ├─ src/
│  │  ├─ components/
│  │  ├─ contexts/
│  │  ├─ services/
│  │  ├─ i18n/
│  │  ├─ locales/
│  │  └─ types/
│  ├─ index.html
│  └─ package.json
├─ finance_backend/          # Django REST API
│  ├─ finance_backend/
│  │  ├─ settings.py
│  │  └─ urls.py
│  ├─ users/
│  ├─ currencies/
│  ├─ manage.py
│  └─ requirements.txt
├─ FIRESTORE_RULES_WITH_SETTINGS.txt
└─ README.md
```

---

## Build ve Çalıştırma Komutları

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

### Backend

```bash
cd finance_backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

---

## Sorun Giderme

### 1) `Firebase Admin SDK başlatılamadı`

- `FIREBASE_CREDENTIALS_JSON` formatı bozuk olabilir.
- JSON içeriğinde `private_key`, `client_email`, `project_id` alanlarını kontrol et.

### 2) `Missing or insufficient permissions` (Firestore)

- Rules doğru yüklenmemiş olabilir.
- Kullanıcı auth olmadan yazma/okuma deniyor olabilir.

### 3) Frontend backend'e bağlanmıyor

- Frontend `API_BASE_URL`: `frontend/src/services/apiService.ts` içinde `http://localhost:8000/api`
- Backend gerçekten `:8000` portunda çalışıyor mu kontrol et.

### 4) Borsa/fon verisi gelmiyor

- `COLLECTAPI_KEY` eksik olabilir.
- Fon servisinde günlük kota dolmuş olabilir (`fund-quota` endpointi ile kontrol et).

---

## Katkı ve Lisans

Bu repo kişisel/portföy amaçlı geliştirilmiştir. PR açmadan önce issue ile öneri paylaşmanız önerilir.
