# Firestore Güvenlik Kuralları - Kapsamlı Versiyon

## ⚠️ ÖNEMLİ UYARI

Firestore güvenlik kurallarını Firebase Console'da güncellemeniz gerekiyor. Bu kurallar projedeki tüm Firestore collection'larını kapsar.

## 📋 Firestore Veri Yapısı

Projede kullanılan tüm Firestore collection'ları:

### Root Level Collections
- `currencies/{currencyCode}` - Global döviz kurları (Finans API'den güncellenir, akıllı zaman kontrolü ile)
- `currencies_metadata/{date}` - Döviz kurları metadata (fetch_time, date, source bilgileri)
- `exchange_rates/{rateId}` - Eski döviz kurları (backward compatibility)
- `borsa/{date}` - Borsa verileri (CollectAPI'den güncellenir, her gün için bir doküman)

### User-Specific Collections (users/{userId}/...)
- `users/{userId}` - Kullanıcı dokümanı (name, email, avatar, createdAt, id)
- `users/{userId}/transactions/{transactionId}` - Kullanıcı işlemleri
- `users/{userId}/investments/{investmentId}` - Kullanıcı yatırımları
- `users/{userId}/investments/{investmentId}/transactions/{transactionId}` - Yatırım işlemleri
- `users/{userId}/quickTransactions/{quickTransactionId}` - Hızlı işlemler
- `users/{userId}/quickInvestments/{quickInvestmentId}` - Hızlı yatırımlar
- `users/{userId}/selectedCurrency/{currencyCode}` - Seçili döviz kurları ve sıralaması
- `users/{userId}/selectedHisse/{hisseCode}` - Seçili hisse senetleri ve sıralaması
- `users/{userId}/quickConvert/{conversionId}` - Hızlı çevirimler (kullanıcı özelleştirilebilir)

## 🔐 Güvenlik Kuralları

### Adım Adım Güncelleme

1. Firebase Console'a Giriş Yapın
   - [Firebase Console](https://console.firebase.google.com/) adresine gidin
   - Projenizi seçin

2. Firestore Database'e Gidin
   - Sol menüden **Firestore Database** seçin
   - **Rules** sekmesine tıklayın

3. Güvenlik Kurallarını Güncelleyin

Aşağıdaki kuralları tamamen değiştirin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // ROOT LEVEL COLLECTIONS
    // ============================================
    
    // Global döviz kurları - Tüm authenticated kullanıcılar okuyup yazabilir
    // Finans API'den güncelleme için gerekli (akıllı zaman kontrolü ile)
    match /currencies/{currencyCode} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Döviz kurları metadata - fetch_time, date, source bilgileri
    // Backend tarafından yazılır (akıllı zaman kontrolü için)
    match /currencies_metadata/{date} {
      allow read: if request.auth != null;
      // Yazma işlemi sadece backend tarafından yapılır (Firebase Admin SDK)
      allow write: if false;
    }
    
    // Eski exchange_rates collection'ı (backward compatibility)
    match /exchange_rates/{rateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Borsa verileri - Tüm authenticated kullanıcılar okuyabilir
    // Backend tarafından yazılır (CollectAPI'den güncelleme)
    match /borsa/{date} {
      allow read: if request.auth != null;
      // Yazma işlemi sadece backend tarafından yapılır (Firebase Admin SDK)
      // Frontend'den yazma yapılmamalı
      allow write: if false;
    }
    
    // ============================================
    // USER-SPECIFIC COLLECTIONS
    // ============================================
    
    match /users/{userId} {
      // Kullanıcı dokümanı - Sadece kendi dokümanını okuyup yazabilir
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
      
      // Kullanıcının işlemleri
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Kullanıcının yatırımları
      match /investments/{investmentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Yatırım işlemleri (nested subcollection)
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
      
      // Seçili döviz kurları
      match /selectedCurrency/{currencyCode} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Seçili hisse senetleri
      match /selectedHisse/{hisseCode} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Hızlı çevirimler
      match /quickConvert/{conversionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // ============================================
    // DEFAULT RULE - Tüm diğer path'leri engelle
    // ============================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Kuralları Yayınlayın
- **Publish** butonuna tıklayın
- Kuralların yayınlanmasını bekleyin (birkaç saniye sürebilir)

### 5. Test Edin
- Uygulamayı yeniden yükleyin
- Login olun ve tüm sayfaları test edin:
  - Transactions sayfası
  - Investments sayfası
  - Currency Converter sayfası
- Tüm collection'lara erişebilmelisiniz

## 📝 Kuralların Açıklaması

### Root Level Collections
- **currencies**: Tüm authenticated kullanıcılar okuyup yazabilir (Finans API güncellemeleri için, akıllı zaman kontrolü ile)
- **currencies_metadata**: Tüm authenticated kullanıcılar okuyabilir (backend tarafından yazılır, akıllı zaman kontrolü için)
- **exchange_rates**: Backward compatibility için, authenticated kullanıcılar erişebilir
- **borsa**: Tüm authenticated kullanıcılar okuyabilir (CollectAPI'den backend tarafından güncellenir)

### User-Specific Collections
- **users/{userId}**: Kullanıcı sadece kendi dokümanını okuyup yazabilir
  - `read`: Kendi dokümanını okuyabilir
  - `create`: İlk girişte kendi dokümanını oluşturabilir
  - `update`: Kendi dokümanını güncelleyebilir
  - `delete`: Kendi dokümanını silebilir
- **users/{userId}/transactions**: Kullanıcı sadece kendi işlemlerini yönetebilir
- **users/{userId}/investments**: Kullanıcı sadece kendi yatırımlarını yönetebilir
- **users/{userId}/investments/{investmentId}/transactions**: Yatırım işlemleri için nested subcollection
- **users/{userId}/quickTransactions**: Hızlı işlemler için kullanıcı bazlı erişim
- **users/{userId}/quickInvestments**: Hızlı yatırımlar için kullanıcı bazlı erişim
- **users/{userId}/selectedCurrency**: Seçili döviz kurları için kullanıcı bazlı erişim
- **users/{userId}/selectedHisse**: Seçili hisse senetleri için kullanıcı bazlı erişim
- **users/{userId}/quickConvert**: Hızlı çevirimler için kullanıcı bazlı erişim (kullanıcılar kendi çevirimlerini ekleyip sıralayabilir)

### Güvenlik Prensibi
- Her kullanıcı sadece kendi verilerine erişebilir
- `request.auth.uid == userId` kontrolü ile veri izolasyonu sağlanır
- Root level collections (currencies, exchange_rates, borsa) tüm authenticated kullanıcılar için ortaktır
- Varsayılan kural tüm diğer path'leri engeller (güvenlik için)

## 🔍 Sorun Giderme

### Hala İzin Hatası Alıyorum
1. Firebase Console'da Rules sekmesinde değişikliklerin kaydedildiğinden emin olun
2. Tarayıcı cache'ini temizleyin
3. Firebase Console'da Rules sekmesinde syntax hatası olmadığını kontrol edin (kırmızı uyarılar varsa)
4. Kullanıcının authenticated olduğundan emin olun (`request.auth != null`)

### Eski exchange_rates Collection'ı Var
- Eski `exchange_rates` collection'ındaki verileri `currencies` collection'ına taşımanız gerekebilir
- Veya backward compatibility için her iki collection için de kural ekleyin (yukarıdaki örnekte gösterildiği gibi)

## ⚠️ Önemli Notlar

- Bu kurallar production için hazırlanmıştır
- Development ortamında test edin
- Kuralları değiştirdikten sonra mutlaka test edin
- Tüm kullanıcı verileri izole edilmiştir (her kullanıcı sadece kendi verilerine erişebilir)
- `currencies` collection'ı `users` ile aynı seviyededir (root level). Tüm kullanıcılar için ortak veridir ve Finans API'den akıllı zaman kontrolü ile güncellenir (10:00, 13:30, 17:00 saatlerinde).
- `currencies_metadata` collection'ı `users` ile aynı seviyededir (root level). Döviz kurları için metadata bilgilerini (fetch_time, date, source) saklar. Backend tarafından yazılır.
- `borsa` collection'ı `users` ile aynı seviyededir (root level). Tüm kullanıcılar için ortak veridir ve CollectAPI'den belirli saatlerde (10:00, 13:30, 17:00) otomatik olarak güncellenir.

