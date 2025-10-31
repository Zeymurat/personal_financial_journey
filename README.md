# 💰 Kişisel Finans Yönetim Uygulaması

Modern web teknolojileri kullanılarak geliştirilmiş, Firebase Authentication ve Firestore veritabanı ile güçlendirilmiş kapsamlı kişisel finans yönetim uygulaması.

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Özellikler](#özellikler)
- [Teknoloji Stack](#teknoloji-stack)
- [Sistem Gereksinimleri](#sistem-gereksinimleri)
- [Proje Yapısı](#proje-yapısı)
- [Kurulum](#kurulum)
- [Yapılandırma](#yapılandırma)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [Firestore Veritabanı](#firestore-veritabanı)
- [Çalıştırma](#çalıştırma)
- [Sorun Giderme](#sorun-giderme)

---

## 🎯 Genel Bakış

Bu proje, kullanıcıların gelir-gider takibi yapabileceği, yatırım portföylerini yönetebileceği ve finansal raporlar alabileceği tam özellikli bir finans yönetim uygulamasıdır.

### Temel Özellikler
- 🔐 Firebase Authentication ile güvenli giriş sistemi
- 💰 Gelir/Gider takibi ve kategorilendirme
- 📈 Yatırım portföyü yönetimi
- 📊 Finansal raporlar ve analitik
- 💱 Çoklu para birimi desteği (sabit kur değeri kaydı)
- 🌙 Dark/Light mode
- 📱 Tam responsive tasarım
- ⚡ Real-time veri güncellemeleri

---

## ✨ Özellikler

### ✅ Tamamlanan Özellikler

#### 🔐 Kimlik Doğrulama
- Firebase Authentication entegrasyonu
- E-posta/Şifre ile kayıt ve giriş
- Google ile giriş
- JWT token tabanlı oturum yönetimi

#### 💰 İşlem Yönetimi
- Gelir ve gider işlemleri ekleme/düzenleme/silme
- Kategorilendirme sistemi
- Tarih bazlı filtreleme
- Çoklu para birimi desteği
- Sabit kur değeri kaydı (o günkü kur ile hesaplanan TL karşılığı)

#### 📈 Yatırım Takibi
- Yatırım portföyü oluşturma
- Hisse senedi, kripto para takibi
- Kar/zarar hesaplamaları
- Yatırım işlemleri (alım/satım)

#### 📊 Dashboard ve Raporlar
- Aylık gelir/gider özeti
- Net durum takibi
- Grafik ve istatistikler
- Geçen ay karşılaştırması

#### ⚡ Hızlı İşlemler
- Sık kullanılan işlemleri kaydetme
- Drag & Drop ile sıralama
- Tek tıkla işlem ekleme

#### 💱 Döviz Çevirici
- Güncel döviz kurları
- Para birimi çevirici
- TL karşılığı hesaplama

---

## 🛠️ Teknoloji Stack

### Frontend

| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.5.3 | Tip güvenliği |
| **Vite** | 5.4.2 | Build tool ve dev server |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **Firebase SDK** | 12.1.0 | Firebase client SDK |
| **Lucide React** | 0.344.0 | Icon library |
| **@dnd-kit** | 6.3.1 | Drag & Drop kütüphanesi |

### Backend

| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| **Python** | 3.6+ | Programlama dili |
| **Django** | 3.2.25 | Web framework |
| **Django REST Framework** | 3.14.0 | REST API framework |
| **Firebase Admin SDK** | 6.4.0 | Firebase server SDK |
| **google-cloud-firestore** | 2.13.1 | Firestore client library |
| **djangorestframework-simplejwt** | 5.3.0 | JWT authentication |
| **django-cors-headers** | 4.3.1 | CORS yönetimi |
| **python-dotenv** | 1.0.0 | Environment variables |

### Veritabanı

| Servis | Açıklama |
|--------|----------|
| **Google Cloud Firestore** | NoSQL veritabanı (real-time) |

### Diğer Servisler

| Servis | Kullanım |
|--------|----------|
| **Firebase Authentication** | Kullanıcı kimlik doğrulama |
| **Firebase Firestore** | Veritabanı |

---

## 💻 Sistem Gereksinimleri

### Gereksinimler

- **Node.js:** 18.0 veya üzeri
- **npm:** 9.0 veya üzeri (Node.js ile birlikte gelir)
- **Python:** 3.6 veya üzeri (3.9+ önerilir)
- **pip:** Python ile birlikte gelir
- **Git:** Versiyon kontrolü için

### Önerilen Sistem

- **RAM:** Minimum 4GB (8GB önerilir)
- **Disk:** En az 2GB boş alan
- **İşletim Sistemi:** Windows, macOS, veya Linux

---

## 📁 Proje Yapısı

```
finance/
├── frontend/                          # React Frontend Uygulaması
│   ├── public/                        # Statik dosyalar
│   ├── src/
│   │   ├── components/                # React bileşenleri
│   │   │   ├── Auth/                  # Kimlik doğrulama bileşenleri
│   │   │   │   ├── AuthWrapper.tsx    # Auth wrapper component
│   │   │   │   ├── Login.tsx         # Giriş sayfası
│   │   │   │   └── Register.tsx      # Kayıt sayfası
│   │   │   ├── Transactions/          # İşlem yönetimi bileşenleri
│   │   │   │   ├── AddTransactionModal.tsx
│   │   │   │   ├── EditTransactionModal.tsx
│   │   │   │   ├── DeleteConfirmationModal.tsx
│   │   │   │   ├── TransactionDetailModal.tsx
│   │   │   │   └── QuickActions.tsx  # Hızlı işlemler
│   │   │   ├── Dashboard.tsx          # Ana dashboard
│   │   │   ├── Transactions.tsx       # İşlemler listesi
│   │   │   ├── Investments.tsx        # Yatırımlar
│   │   │   ├── Reports.tsx           # Raporlar
│   │   │   ├── CurrencyConverter.tsx # Döviz çevirici
│   │   │   ├── Settings.tsx          # Ayarlar
│   │   │   └── Sidebar.tsx           # Yan menü
│   │   ├── contexts/                  # React Context'ler
│   │   │   ├── AuthContext.tsx       # Kimlik doğrulama context
│   │   │   └── FinanceContext.tsx    # Finans context
│   │   ├── services/                  # API servisleri
│   │   │   ├── apiService.ts         # Backend API client
│   │   │   ├── transactionService.ts # İşlem servisleri
│   │   │   ├── investmentService.ts   # Yatırım servisleri
│   │   │   ├── currencyService.ts    # Döviz servisleri
│   │   │   └── firestoreService.ts   # Firestore servisleri
│   │   ├── types/                     # TypeScript tip tanımları
│   │   │   ├── index.ts              # Ana tip tanımları
│   │   │   └── firebase.d.ts         # Firebase tip tanımları
│   │   ├── utils/                     # Yardımcı fonksiyonlar
│   │   │   └── firestoreUtils.ts
│   │   ├── data/                      # Mock veriler (geliştirme)
│   │   │   └── mockData.ts
│   │   ├── App.tsx                    # Ana uygulama bileşeni
│   │   ├── main.tsx                   # Uygulama giriş noktası
│   │   ├── firebase.ts                # Firebase yapılandırması
│   │   └── index.css                  # Global CSS
│   ├── index.html                     # HTML template
│   ├── vite.config.ts                 # Vite yapılandırması
│   ├── tailwind.config.js            # Tailwind yapılandırması
│   ├── tsconfig.json                  # TypeScript yapılandırması
│   ├── package.json                  # Frontend bağımlılıkları
│   └── README.md
│
├── finance_backend/                   # Django Backend Uygulaması
│   ├── finance_backend/               # Django proje ayarları
│   │   ├── __init__.py
│   │   ├── settings.py               # Django ayarları
│   │   ├── urls.py                   # Ana URL yapılandırması
│   │   ├── wsgi.py                   # WSGI yapılandırması
│   │   └── asgi.py                   # ASGI yapılandırması
│   ├── users/                        # Kullanıcı uygulaması
│   │   ├── __init__.py
│   │   ├── authentication.py         # Firebase authentication
│   │   ├── firestore_service.py      # Firestore servis katmanı
│   │   ├── firestore_views.py        # Firestore API view'ları
│   │   ├── views.py                  # Genel view'lar
│   │   ├── urls.py                   # URL routing
│   │   ├── serializers.py            # DRF serializers
│   │   ├── admin.py                  # Django admin
│   │   ├── management/               # Django management komutları
│   │   │   └── commands/
│   │   │       ├── seed_firestore.py          # Test verisi ekleme
│   │   │       ├── test_data_isolation.py      # Veri izolasyon testi
│   │   │       ├── test_security.py            # Güvenlik testi
│   │   │       └── visualize_firestore.py     # Firestore görselleştirme
│   │   └── migrations/               # Django migrations
│   ├── manage.py                     # Django yönetim scripti
│   ├── requirements.txt              # Python bağımlılıkları
│   ├── package.json                  # Node.js bağımlılıkları (opsiyonel)
│   └── README.md
│
├── .env                              # Environment variables (oluşturulmalı)
├── .gitignore                        # Git ignore dosyası
├── README.md                          # Bu dosya
├── PROJE_ANALIZ_RAPORU.md            # Proje analiz raporu
└── Gelecek özellikler.txt            # Gelecek özellikler listesi
```

---

## 🚀 Kurulum

### 1️⃣ Repository'yi Klonlayın

```bash
git clone https://github.com/Zeymurat/personal_financial_journey.git
cd personal_financial_journey
```

### 2️⃣ Firebase Projesi Oluşturun

1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. Yeni bir proje oluşturun
3. **Authentication**'ı etkinleştirin:
   - Authentication > Sign-in method > Email/Password'ü etkinleştirin
   - Google Sign-in'i etkinleştirin (opsiyonel)
4. **Firestore Database**'i oluşturun:
   - Firestore Database > Create database
   - Test mode'da başlatın (güvenlik kuralları sonra eklenecek)
5. **Service Account** oluşturun:
   - Project Settings > Service Accounts
   - "Generate new private key" butonuna tıklayın
   - JSON dosyasını indirin (backend için gerekli)

### 3️⃣ Environment Variables Yapılandırması

Proje kök dizininde `.env` dosyası oluşturun:

```bash
# Proje kök dizininde
touch .env
```

`.env` dosyasına aşağıdaki içeriği ekleyin:

```env
# ============================================
# Django Backend Ayarları
# ============================================

# Django Secret Key (güvenli bir key oluşturun)
# Python ile oluşturabilirsiniz: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
DJANGO_SECRET_KEY=your-secret-key-here

# Debug modu (production'da False olmalı)
DEBUG=True

# İzin verilen hostlar (virgülle ayrılmış)
ALLOWED_HOSTS=localhost,127.0.0.1

# ============================================
# Firebase Admin SDK (Backend için)
# ============================================
# Service Account JSON'unun tam içeriğini buraya yapıştırın
# İndirdiğiniz JSON dosyasını açın ve içeriğini tek satırda buraya kopyalayın
FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id",...}

# ============================================
# Firebase Client Config (Frontend için)
# ============================================
# Firebase Console > Project Settings > Your apps > Web app'ten alın

VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Önemli:** 
- `FIREBASE_CREDENTIALS_JSON` için indirdiğiniz JSON dosyasının tam içeriğini tek satırda yapıştırın
- Tüm değerleri kendi Firebase projenizden alın

### 4️⃣ Backend Kurulumu

#### Python Virtual Environment Oluşturun

```bash
cd finance_backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Bağımlılıkları Yükleyin

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Veritabanı Migrasyonları (Opsiyonel - Firestore kullandığımız için gerekli değil)

```bash
python manage.py migrate
```

### 5️⃣ Frontend Kurulumu

```bash
cd frontend
npm install
```

---

## ⚙️ Yapılandırma

### Firestore Güvenlik Kuralları

Firebase Console > Firestore Database > Rules sekmesine gidin ve aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcı dokümanları - sadece kendi dokümanına erişebilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Kullanıcının işlemleri
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Kullanıcının yatırımları
      match /investments/{investmentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Yatırım işlemleri
        match /transactions/{transactionId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
      
      // Hızlı işlemler
      match /quickTransactions/{quickTransactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Hızlı yatırımlar
      match /quickInvestments/{quickInvestmentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Döviz kurları - herkes okuyabilir
    match /exchange_rates/{rateId} {
      allow read: if request.auth != null;
      allow write: if false; // Sadece admin yazabilir
    }
  }
}
```

### CORS Ayarları

Backend CORS ayarları `finance_backend/finance_backend/settings.py` dosyasında yapılandırılmıştır. Development için `CORS_ALLOW_ALL_ORIGINS = True` ayarlıdır. Production'da bunu değiştirmeniz gerekir.

---

## 📡 API Dokümantasyonu

### Base URL

```
http://localhost:8000/api/auth
```

### Authentication

Tüm API endpoint'leri Firebase ID Token gerektirir. Token'ı request header'ında göndermelisiniz:

```
Authorization: Bearer <firebase_id_token>
```

### 1. Authentication Endpoints

#### 🔐 Firebase Login

Firebase Authentication ile giriş yapıp token alın.

```http
POST /api/auth/firebase-login/
Content-Type: application/json

{
  "id_token": "firebase_id_token_here"
}
```

**Response:**
```json
{
  "message": "Giriş başarılı",
  "uid": "user_uid",
  "email": "user@example.com",
  "access": "firebase_id_token",
  "refresh": "firebase_id_token"
}
```

---

### 2. Transactions (İşlemler)

#### 📋 Tüm İşlemleri Listele

```http
GET /api/auth/transactions/?type=expense&category=Market
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (opsiyonel): `income` veya `expense`
- `category` (opsiyonel): Kategori adı

**Response:**
```json
[
  {
    "id": "transaction_id",
    "type": "expense",
    "amount": 100.50,
    "amountInTRY": 3020.00,
    "category": "Market",
    "description": "Market alışverişi",
    "date": "2024-01-15",
    "currency": "USD",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

#### ➕ Yeni İşlem Oluştur

```http
POST /api/auth/transactions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "expense",
  "amount": 20.00,
  "category": "Market",
  "description": "Market alışverişi",
  "date": "2024-01-15",
  "currency": "USD",
  "amountInTRY": 600.00
}
```

**Required Fields:**
- `type`: `income` veya `expense`
- `amount`: Sayısal değer
- `category`: Kategori adı
- `description`: Açıklama
- `date`: `YYYY-MM-DD` formatında tarih
- `currency`: Para birimi kodu (TRY, USD, EUR, vb.)
- `amountInTRY`: O günkü kur ile hesaplanmış TL karşılığı (opsiyonel, frontend otomatik hesaplar)

**Response:**
```json
{
  "id": "transaction_id",
  "message": "İşlem başarıyla oluşturuldu"
}
```

#### ✏️ İşlem Güncelle

```http
PUT /api/auth/transactions/{transaction_id}/
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "expense",
  "amount": 25.00,
  "category": "Market",
  "description": "Güncellenmiş market alışverişi",
  "date": "2024-01-15",
  "currency": "USD",
  "amountInTRY": 750.00
}
```

#### 🗑️ İşlem Sil

```http
DELETE /api/auth/transactions/{transaction_id}/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "İşlem başarıyla silindi"
}
```

---

### 3. Quick Transactions (Hızlı İşlemler)

#### 📋 Hızlı İşlemleri Listele

```http
GET /api/auth/quick-transactions/
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "quick_transaction_id",
    "name": "Kahve",
    "type": "expense",
    "amount": 50.00,
    "category": "Eğlence",
    "description": "Kahve",
    "currency": "TRY",
    "order": 0,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

#### ➕ Hızlı İşlem Oluştur

```http
POST /api/auth/quick-transactions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Kahve",
  "type": "expense",
  "amount": 50.00,
  "category": "Eğlence",
  "description": "Kahve",
  "currency": "TRY",
  "order": 0
}
```

#### ✏️ Hızlı İşlem Güncelle

```http
PUT /api/auth/quick-transactions/{quick_transaction_id}/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Kahve",
  "type": "expense",
  "amount": 60.00,
  "category": "Eğlence",
  "description": "Kahve",
  "currency": "TRY",
  "order": 0
}
```

#### 🗑️ Hızlı İşlem Sil

```http
DELETE /api/auth/quick-transactions/{quick_transaction_id}/
Authorization: Bearer <token>
```

---

### 4. Investments (Yatırımlar)

#### 📋 Tüm Yatırımları Listele

```http
GET /api/auth/investments/
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "investment_id",
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "type": "stock",
    "quantity": 10,
    "averagePrice": 150.00,
    "currentPrice": 175.50,
    "totalValue": 1755.00,
    "profitLoss": 255.00,
    "profitLossPercentage": 17.0,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

#### ➕ Yeni Yatırım Oluştur

```http
POST /api/auth/investments/
Authorization: Bearer <token>
Content-Type: application/json

{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "type": "stock",
  "quantity": 10,
  "averagePrice": 150.00,
  "currentPrice": 175.50
}
```

**Required Fields:**
- `symbol`: Sembol kodu
- `name`: Yatırım adı
- `type`: `stock`, `crypto`, veya `forex`
- `quantity`: Miktar
- `averagePrice`: Ortalama alış fiyatı
- `currentPrice`: Güncel fiyat

**Note:** `totalValue`, `profitLoss`, ve `profitLossPercentage` otomatik hesaplanır.

#### ✏️ Yatırım Güncelle

```http
PUT /api/auth/investments/{investment_id}/
Authorization: Bearer <token>
Content-Type: application/json

{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "type": "stock",
  "quantity": 15,
  "averagePrice": 150.00,
  "currentPrice": 180.00
}
```

#### 🗑️ Yatırım Sil

```http
DELETE /api/auth/investments/{investment_id}/
Authorization: Bearer <token>
```

---

### 5. Investment Transactions (Yatırım İşlemleri)

#### 📋 Yatırım İşlemlerini Listele

```http
GET /api/auth/investments/{investment_id}/transactions/
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "transaction_id",
    "type": "buy",
    "quantity": 10,
    "price": 150.00,
    "totalAmount": 1500.00,
    "date": "2024-01-15",
    "fees": 10.00,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

#### ➕ Yatırım İşlemi Ekle

```http
POST /api/auth/investments/{investment_id}/transactions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "buy",
  "quantity": 10,
  "price": 150.00,
  "totalAmount": 1500.00,
  "date": "2024-01-15",
  "fees": 10.00
}
```

**Required Fields:**
- `type`: `buy` veya `sell`
- `quantity`: Miktar
- `price`: İşlem fiyatı
- `totalAmount`: Toplam tutar
- `date`: `YYYY-MM-DD` formatında tarih
- `fees`: Komisyon (opsiyonel)

---

### Hata Yönetimi

Tüm API endpoint'leri standart HTTP status kodları döndürür:

- `200 OK`: Başarılı işlem
- `201 Created`: Başarıyla oluşturuldu
- `400 Bad Request`: Geçersiz istek
- `401 Unauthorized`: Kimlik doğrulama hatası
- `403 Forbidden`: Yetki hatası
- `404 Not Found`: Kaynak bulunamadı
- `500 Internal Server Error`: Sunucu hatası

**Hata Response Formatı:**
```json
{
  "error": "Hata mesajı burada"
}
```

---

## 🔥 Firestore Veritabanı

### Veri Yapısı

```
users/
  {userId}/
    transactions/
      {transactionId}/
        - type: "income" | "expense"
        - amount: number
        - amountInTRY: number (o günkü kur ile hesaplanmış)
        - category: string
        - description: string
        - date: timestamp
        - currency: string
        - createdAt: timestamp
        - updatedAt: timestamp
    
    investments/
      {investmentId}/
        - symbol: string
        - name: string
        - type: "stock" | "crypto" | "forex"
        - quantity: number
        - averagePrice: number
        - currentPrice: number
        - totalValue: number
        - profitLoss: number
        - profitLossPercentage: number
        - transactions/ (subcollection)
          {transactionId}/
            - type: "buy" | "sell"
            - quantity: number
            - price: number
            - totalAmount: number
            - date: timestamp
            - fees: number (optional)
            - createdAt: timestamp
    
    quickTransactions/
      {quickTransactionId}/
        - name: string
        - type: "income" | "expense"
        - amount: number
        - category: string
        - description: string
        - currency: string
        - order: number
        - createdAt: timestamp
        - updatedAt: timestamp

exchange_rates/
  {currencyCode}/
    - code: string
    - name: string
    - rate: number
    - change: number
    - lastUpdated: timestamp
```

### Veri İzolasyonu

Her kullanıcı sadece kendi verilerine erişebilir. Firestore güvenlik kuralları ve backend yetkilendirme katmanı bu izolasyonu sağlar.

---

## ▶️ Çalıştırma

### Development Modu

#### 1. Backend'i Başlatın

```bash
cd finance_backend

# Virtual environment'ı aktive edin (eğer etkin değilse)
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Django sunucusunu başlatın
python manage.py runserver
```

Backend `http://localhost:8000` adresinde çalışacaktır.

#### 2. Frontend'i Başlatın

Yeni bir terminal penceresi açın:

```bash
cd frontend
npm run dev
```

Frontend `http://localhost:5173` adresinde çalışacaktır.

#### 3. Tarayıcıda Açın

Tarayıcınızda `http://localhost:5173` adresine gidin.

### Production Build

#### Frontend Build

```bash
cd frontend
npm run build
```

Build edilmiş dosyalar `frontend/dist` dizininde oluşturulur.

---

## 🔧 Sorun Giderme

### Backend Sorunları

#### "Firebase Admin SDK başlatılamadı" Hatası

**Çözüm:**
- `.env` dosyasında `FIREBASE_CREDENTIALS_JSON` değerini kontrol edin
- JSON formatının doğru olduğundan emin olun (tek satır, tırnak işaretleri escape edilmiş)
- Service Account key'in doğru indirildiğinden emin olun

#### "Module not found" Hatası

**Çözüm:**
```bash
cd finance_backend
pip install -r requirements.txt
```

#### Port Zaten Kullanımda

**Çözüm:**
```bash
# Farklı bir port kullanın
python manage.py runserver 8001
```

### Frontend Sorunları

#### "Cannot find module" Hatası

**Çözüm:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variables Yüklenmiyor

**Çözüm:**
- `.env` dosyasının proje kök dizininde olduğundan emin olun
- `VITE_` prefix'li değişkenlerin doğru yazıldığından emin olun
- Development server'ı yeniden başlatın

#### CORS Hatası

**Çözüm:**
- Backend'in çalıştığından emin olun
- `finance_backend/finance_backend/settings.py` dosyasında CORS ayarlarını kontrol edin

### Firebase Sorunları

#### Authentication Çalışmıyor

**Çözüm:**
- Firebase Console'da Authentication'ın etkin olduğundan emin olun
- Email/Password sign-in method'unun etkin olduğunu kontrol edin
- `.env` dosyasındaki Firebase config değerlerini kontrol edin

#### Firestore Verileri Görünmüyor

**Çözüm:**
- Firestore Database'in oluşturulduğundan emin olun
- Güvenlik kurallarını kontrol edin
- Kullanıcının giriş yaptığından emin olun

---

## 📝 Kullanım Notları

### Para Birimi ve Kur Sistemi

- İşlemler oluşturulurken o günkü döviz kuru ile TL karşılığı (`amountInTRY`) hesaplanır ve kaydedilir
- Bu değer sabit kalır, sonraki kur değişikliklerinden etkilenmez
- Toplam hesaplamalarda bu sabit `amountInTRY` değeri kullanılır
- Bu sayede geçmiş işlemler gerçek değerleriyle gösterilir

### Güvenlik

- Tüm API endpoint'leri Firebase Authentication gerektirir
- Her kullanıcı sadece kendi verilerine erişebilir
- Firestore güvenlik kuralları backend ile birlikte çalışır

### Performance

- Firestore real-time updates kullanır
- Veriler otomatik olarak senkronize edilir
- İlk yükleme sonrası cache mekanizması kullanılır

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Kod Standartları

- **Python:** PEP 8 standartlarına uyun
- **TypeScript:** ESLint kurallarına uyun
- **Git:** Anlamlı commit mesajları kullanın
- **Dokümantasyon:** Kod değişikliklerini dokümante edin

---

## 📄 Lisans

Bu proje açık kaynaklıdır.

---

## 📞 İletişim

- **Proje Linki:** [GitHub Repository](https://github.com/Zeymurat/personal_financial_journey)
- **Website:** [https://zeynelcmurat.com](https://zeynelcmurat.com)
- **Issues:** GitHub Issues sayfasından sorun bildirebilirsiniz

---

## 🙏 Teşekkürler

Bu projeyi kullanmayı tercih ettiğiniz için teşekkür ederiz! 

⭐ **Beğendiyseniz yıldız vermeyi unutmayın!**

---

**Son Güncelleme:** 2025
