import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { hasStoredAccessToken } from '../services/authTokenStore';

const MAX_RETRIES = 5;
const RETRY_MS = 500;

/**
 * Mount sonrası token varlığını doğrular.
 * Geçerlilik kontrolü apiRequest 401 retry zincirine bırakılır (DRY — tek yerde auth hatası).
 *
 * Big-O: O(1) storage okuma; en fazla MAX_RETRIES timer (sabit üst sınır).
 */
export const useTokenValidation = () => {
  const { currentUser, logout, loading, authenticating } = useAuth();
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const validateToken = async () => {
      if (loading || authenticating) {
        if (authenticating) retryCountRef.current = 0;
        return;
      }

      if (!currentUser) {
        retryCountRef.current = 0;
        return;
      }

      if (!hasStoredAccessToken()) {
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          retryTimeoutRef.current = setTimeout(() => {
            validateToken();
          }, RETRY_MS);
          return;
        }

        retryCountRef.current = 0;
        toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        await logout();
        return;
      }

      retryCountRef.current = 0;
    };

    validateToken();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [currentUser, logout, loading, authenticating]);
};
