import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

/**
 * Token doğrulama hook'u
 * Sayfa mount olduğunda token'ı kontrol eder
 * Geçersiz veya yoksa kullanıcıyı logout yapar (AuthWrapper Login sayfasını gösterir)
 */
export const useTokenValidation = () => {
  const { currentUser, logout, loading, authenticating } = useAuth();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    // Cleanup önceki timeout'u temizle
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const validateToken = async () => {
      // Auth yükleniyorsa bekle
      if (loading) {
        console.log('⏳ Auth yükleniyor, token kontrolü bekleniyor...');
        return;
      }

      // Authentication işlemi devam ediyorsa bekle (token henüz alınmamış olabilir)
      if (authenticating) {
        console.log('⏳ Authentication işlemi devam ediyor, token kontrolü bekleniyor...');
        retryCountRef.current = 0; // Reset retry count when authenticating
        return;
      }

      // Kullanıcı yoksa kontrol etmeye gerek yok (login sayfasında olabilir)
      if (!currentUser) {
        retryCountRef.current = 0; // Reset retry count when no user
        return;
      }

      const token = localStorage.getItem('access_token');
      
      // Token yoksa, kısa bir süre bekleyip tekrar kontrol et
      // (onAuthStateChanged içinde processUserAuthentication çağrılıyor olabilir)
      if (!token) {
        // Maksimum 5 kez, her seferinde 500ms bekleyerek kontrol et
        // Bu, onAuthStateChanged içindeki processUserAuthentication'ın tamamlanması için zaman tanır
        if (retryCountRef.current < 5) {
          retryCountRef.current += 1;
          console.log(`⏳ Token bulunamadı (authenticating: ${authenticating}), ${retryCountRef.current}. kez tekrar kontrol ediliyor (500ms sonra)...`);
          
          // Önceki timeout'u temizle
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          // 500ms sonra tekrar kontrol et
          retryTimeoutRef.current = setTimeout(() => {
            validateToken();
          }, 500);
          return;
        }
        
        // 5 denemeden sonra hala token yoksa logout yap
        console.warn('🔒 Token bulunamadı (5 deneme sonrası), kullanıcı çıkış yapılıyor...');
        retryCountRef.current = 0; // Reset retry count
        toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        await logout();
        return;
      }

      // Token mevcut, retry count'u sıfırla
      if (retryCountRef.current > 0) {
        console.log('✅ Token bulundu!');
        retryCountRef.current = 0;
      }

      // Token mevcut, geçerliliği backend'den gelecek 401/403 hataları ile kontrol edilecek
      // apiService.ts'teki 401/403 handler zaten logout yapıyor
      console.log('✅ Token mevcut, sayfa yüklendi');
    };

    // Sayfa mount olduğunda ve auth yüklendikten sonra token kontrolü yap
    validateToken();

    // Cleanup: timeout'u temizle
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [currentUser, logout, loading, authenticating]);
};

