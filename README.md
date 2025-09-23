# 🚀 Finans Uygulaması - Firestore Entegrasyonu

Modern web teknolojileri kullanarak geliştirilmiş kapsamlı kişisel finans yönetim uygulaması.

## 🏗️ **Proje Yapısı**

```
finance/
├── frontend/                 # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/      # UI Bileşenleri
│   │   ├── services/        # API Servisleri
│   │   ├── context/         # React Context'ler
│   │   └── types/           # TypeScript Tipleri
├── finance_backend/          # Django Backend
│   ├── users/               # Kullanıcı Yönetimi
│   └── firestore_service.py # Firestore Entegrasyonu
└── .env                     # Environment Variables
```

## 🚀 **Özellikler**

### ✅ **Tamamlanan Özellikler**
- 🔐 Firebase Authentication
- 💰 Gelir/Gider Takibi
- 📈 Yatırım Portföyü
- 📊 Finansal Raporlar
- 💱 Döviz Çevirici
- 🌙 Dark/Light Mode
- 📱 Responsive Tasarım

### 🔥 **Yeni Firestore Entegrasyonu**
- 🗄️ Firestore Veritabanı
- 🔄 Real-time Updates
- 📡 REST API Endpoints
- 🔒 Güvenli Veri Erişimi

## 🛠️ **Teknoloji Stack**

### **Frontend**
- React 18.3.1 + TypeScript 5.5.3
- Vite Build Tool
- Tailwind CSS
- Firebase SDK
- Lucide React Icons

### **Backend**
- Django 3.2.25
- Django REST Framework
- Firebase Admin SDK
- Firestore Database
- JWT Authentication

## 📋 **Kurulum**

### 1️⃣ **Prerequisites**
- Node.js 18+
- Python 3.8+
- Firebase Projesi
- Firestore Database

### 2️⃣ **Environment Variables**
`.env` dosyasını oluşturun:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# Firebase Admin SDK
FIREBASE_CREDENTIALS_JSON='{"type": "service_account", ...}'

# Frontend Firebase Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3️⃣ **Backend Kurulumu**
```bash
cd finance_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 4️⃣ **Frontend Kurulumu**
```bash
cd frontend
npm install
npm run dev
```

## 🔥 **Firestore Güvenlik Kuralları**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar sadece kendi verilerini okuyabilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // İşlemler
    match /users/{userId}/transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Yatırımlar
    match /users/{userId}/investments/{investmentId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Yatırım işlemleri
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 📡 **API Endpoints**

### **Authentication**
- `POST /api/auth/firebase-login/` - Firebase ile giriş
- `POST /api/auth/token/refresh/` - Token yenileme
- `POST /api/auth/logout/` - Çıkış

### **Transactions**
- `GET /api/auth/transactions/` - İşlemleri listele
- `POST /api/auth/transactions/` - Yeni işlem oluştur
- `PUT /api/auth/transactions/{id}/` - İşlem güncelle
- `DELETE /api/auth/transactions/{id}/` - İşlem sil

### **Investments**
- `GET /api/auth/investments/` - Yatırımları listele
- `POST /api/auth/investments/` - Yeni yatırım oluştur
- `PUT /api/auth/investments/{id}/` - Yatırım güncelle
- `DELETE /api/auth/investments/{id}/` - Yatırım sil

### **Investment Transactions**
- `GET /api/auth/investments/{id}/transactions/` - Yatırım işlemlerini listele
- `POST /api/auth/investments/{id}/transactions/` - Yeni yatırım işlemi ekle

## 🔄 **Veri Akışı**

1. **Frontend** → Firebase Authentication
2. **Backend** → Firebase Admin SDK ile token doğrulama
3. **Backend** → Firestore veri işlemleri
4. **Frontend** → Backend API'leri ile veri alışverişi

## 🚀 **Geliştirme Sonraki Adımlar**

- [ ] Unit Testler
- [ ] Integration Testler
- [ ] Error Handling Geliştirme
- [ ] Loading States
- [ ] Offline Support
- [ ] Push Notifications
- [ ] Data Export/Import
- [ ] Multi-language Support

## 📝 **Katkıda Bulunma**

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 **Lisans**



## 🤝 **İletişim**

- **Proje Linki:** [https://github.com/username/finance](https://github.com/username/finance)
- **Issues:** [https://github.com/username/finance/issues](https://github.com/username/finance/issues)

---

⭐ **Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!** 