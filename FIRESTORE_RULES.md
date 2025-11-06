# Firestore Güvenlik Kuralları - Güncel Versiyon

## ⚠️ ÖNEMLİ UYARI

Firestore güvenlik kurallarını Firebase Console'da güncellemeniz gerekiyor. Bu kurallar projedeki tüm Firestore collection'larını kapsar.

## 📋 Firestore Veri Yapısı

Projede kullanılan tüm Firestore collection'ları:

### Root Level Collections (Artık kullanılmıyor - Local JSON dosyalarına taşındı)
- ~~`currencies/{currencyCode}`~~ → Artık `currencies.json` dosyasında
- ~~`currencies_metadata/{date}`~~ → Artık `currencies.json` içinde
- ~~`exchange_rates/{rateId}`~~ → Artık kullanılmıyor
- ~~`borsa/{date}`~~ → Artık `borsa.json` dosyasında
- ~~`funds`~~ → Artık `funds.json` dosyasında

### User-Specific Collections (users/{userId}/...)
- `users/{userId}` - Kullanıcı dokümanı (name, email, avatar, createdAt, id)
- `users/{userId}/transactions/{transactionId}` - Kullanıcı işlemleri
- `users/{userId}/investments/{investmentId}` - Kullanıcı yatırımları
- `users/{userId}/investments/{investmentId}/transactions/{transactionId}` - Yatırım işlemleri
- `users/{userId}/quickTransactions/{quickTransactionId}` - Hızlı işlemler
- `users/{userId}/quickInvestments/{quickInvestmentId}` - Hızlı yatırımlar
- `users/{userId}/selectedCurrency/{currencyCode}` - Seçili döviz kurları ve sıralaması
- `users/{userId}/selectedHisse/{hisseCode}` - Seçili hisse senetleri ve sıralaması
- `users/{userId}/selectedFund/{fundKey}` - Seçili yatırım fonları ve sıralaması
- `users/{userId}/followedCurrency/{currencyCode}` - Takip edilen döviz kurları (Takip ve Karşılaştırma sayfası için) ⭐ YENİ
- `users/{userId}/followedFund/{fundKey}` - Takip edilen yatırım fonları (Takip ve Karşılaştırma sayfası için) ⭐ YENİ
- `users/{userId}/followedHisse/{hisseCode}` - Takip edilen hisse senetleri (Takip ve Karşılaştırma sayfası için) ⭐ YENİ
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
    
    // Global döviz kurları - Artık kullanılmıyor (local JSON dosyasına taşındı)
    // Eski veriler için backward compatibility
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
      
      // Seçili yatırım fonları
      match /selectedFund/{fundKey} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Takip edilen döviz kurları (Takip ve Karşılaştırma sayfası için)
      match /followedCurrency/{currencyCode} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Takip edilen yatırım fonları (Takip ve Karşılaştırma sayfası için)
      match /followedFund/{fundKey} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Takip edilen hisse senetleri (Takip ve Karşılaştırma sayfası için)
      match /followedHisse/{hisseCode} {
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
- Login olun ve Investments sayfasında fon seçmeyi test edin
- Artık fon seçebilmelisiniz!

## 📝 Kuralların Açıklaması

### Root Level Collections (Artık kullanılmıyor)
- **currencies**: Artık `currencies.json` dosyasında saklanıyor
- **exchange_rates**: Eski collection (backward compatibility için)
- **borsa**: Artık `borsa.json` dosyasında saklanıyor
- **funds**: Artık `funds.json` dosyasında saklanıyor

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
- **users/{userId}/selectedFund**: Seçili yatırım fonları için kullanıcı bazlı erişim
- **users/{userId}/followedCurrency**: Takip edilen döviz kurları için kullanıcı bazlı erişim (Takip ve Karşılaştırma sayfası) ⭐ YENİ
- **users/{userId}/followedFund**: Takip edilen yatırım fonları için kullanıcı bazlı erişim (Takip ve Karşılaştırma sayfası) ⭐ YENİ
- **users/{userId}/followedHisse**: Takip edilen hisse senetleri için kullanıcı bazlı erişim (Takip ve Karşılaştırma sayfası) ⭐ YENİ
- **users/{userId}/quickConvert**: Hızlı çevirimler için kullanıcı bazlı erişim (kullanıcılar kendi çevirimlerini ekleyip sıralayabilir)

### Güvenlik Prensibi
- Her kullanıcı sadece kendi verilerine erişebilir
- `request.auth.uid == userId` kontrolü ile veri izolasyonu sağlanır
- Root level collections artık kullanılmıyor (local JSON dosyalarına taşındı)
- Varsayılan kural tüm diğer path'leri engeller (güvenlik için)

## 🔍 Sorun Giderme

### Hala İzin Hatası Alıyorum
1. Firebase Console'da Rules sekmesinde değişikliklerin kaydedildiğinden emin olun
2. **Publish** butonuna tıkladığınızdan emin olun
3. Tarayıcı cache'ini temizleyin
4. Firebase Console'da Rules sekmesinde syntax hatası olmadığını kontrol edin (kırmızı uyarılar varsa)
5. Kullanıcının authenticated olduğundan emin olun (`request.auth != null`)

### selectedFund Collection'ı İçin İzin Hatası
- **Çözüm**: Yukarıdaki rules'a `selectedFund` collection'ı için kural ekleyin (yukarıda gösterildiği gibi)
- `selectedCurrency` ve `selectedHisse` ile aynı mantıkta çalışır

## ⚠️ Önemli Notlar

- Bu kurallar production için hazırlanmıştır
- Development ortamında test edin
- Kuralları değiştirdikten sonra mutlaka test edin
- Tüm kullanıcı verileri izole edilmiştir (her kullanıcı sadece kendi verilerine erişebilir)
- Global veriler (currencies, borsa, funds) artık local JSON dosyalarında saklanıyor (`finance_backend/currencies/` dizininde)
- Kullanıcı seçimleri (selectedCurrency, selectedHisse, selectedFund) hala Firestore'da saklanıyor
