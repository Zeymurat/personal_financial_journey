import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Token doğrulama hook'u
 * Sayfa mount olduğunda token'ı kontrol eder
 * Geçersiz veya yoksa kullanıcıyı logout yapar (AuthWrapper Login sayfasını gösterir)
 */
export const useTokenValidation = () => {
  const { currentUser, logout, loading } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      // Auth yükleniyorsa bekle
      if (loading) {
        return;
      }

      // Kullanıcı yoksa kontrol etmeye gerek yok (login sayfasında olabilir)
      if (!currentUser) {
        return;
      }

      const token = localStorage.getItem('access_token');
      
      // Token yoksa logout yap
      if (!token) {
        console.warn('🔒 Token bulunamadı, kullanıcı çıkış yapılıyor...');
        await logout();
        return;
      }

      // Token mevcut, geçerliliği backend'den gelecek 401/403 hataları ile kontrol edilecek
      // apiService.ts'teki 401/403 handler zaten logout yapıyor
      console.log('✅ Token mevcut, sayfa yüklendi');
    };

    // Sayfa mount olduğunda ve auth yüklendikten sonra token kontrolü yap
    validateToken();
  }, [currentUser, logout, loading]);
};

