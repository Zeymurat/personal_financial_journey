# Firestore Kuralları - selectedHisse İçin Güncelleme

## ⚠️ ÖNEMLİ: Bu kuralı Firebase Console'da güncellemeniz gerekiyor!

Sorun: `saveSelectedHisse` fonksiyonu batch write kullanıyor (delete + set). Mevcut kurallar yeterli olmayabilir.

## 🔧 Çözüm: Daha Detaylı İzinler

Firebase Console'da `selectedHisse` kuralını şu şekilde güncelleyin:

```javascript
// Seçili hisse senetleri
match /selectedHisse/{hisseCode} {
  // Read ve write izinleri
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && request.auth.uid == userId;
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

Veya daha kısa versiyon (zaten çalışması gerekir ama deneyelim):

```javascript
// Seçili hisse senetleri
match /selectedHisse/{hisseCode} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## 📝 Adımlar

1. Firebase Console'a gidin: https://console.firebase.google.com/
2. Projenizi seçin
3. **Firestore Database** > **Rules** sekmesine gidin
4. `selectedHisse` kuralını bulun (satır 114-117 civarı)
5. Kuralı yukarıdaki gibi güncelleyin
6. **Publish** butonuna tıklayın
7. Birkaç saniye bekleyin (kuralların yayınlanması için)
8. Sayfayı yenileyin ve tekrar deneyin

## 🔍 Debug İçin

Eğer hala çalışmıyorsa, console'da şunu kontrol edin:
- `currentUser?.id` değeri nedir?
- Firestore'da `users/{userId}/selectedHisse` path'i var mı?

## 💡 Alternatif Çözüm

Eğer hala çalışmıyorsa, `saveSelectedHisse` fonksiyonunu tek tek kaydetme yöntemine çevirebiliriz (batch yerine).

