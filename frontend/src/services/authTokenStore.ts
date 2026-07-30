/**
 * Auth token storage — Single Responsibility (SOLID: S)
 *
 * Tek sorumluluk: access token'ı okumak / yazmak / silmek.
 * API katmanı ve AuthContext aynı storage sözleşmesini kullanır (DRY).
 *
 * Not: Firebase ID token ~1 saat yaşar. Kalıcı "refresh JWT" yok;
 * yenileme Firebase `getIdToken(true)` ile yapılır.
 */

const ACCESS_TOKEN_KEY = 'access_token';

/** Eski sahte refresh anahtarı — geriye dönük temizlik için */
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken';

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/** O(1) — sabit sayıda localStorage işlemi */
export function clearStoredAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

export function hasStoredAccessToken(): boolean {
  return Boolean(getStoredAccessToken());
}
