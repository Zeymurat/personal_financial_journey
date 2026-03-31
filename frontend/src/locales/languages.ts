/** Uygulama dil kodları — Settings ve i18n ile uyumlu */
export const APP_LANGUAGE_CODES = ['tr', 'en', 'de', 'fr', 'es'] as const;
export type AppLanguageCode = (typeof APP_LANGUAGE_CODES)[number];

export function isAppLanguageCode(value: string): value is AppLanguageCode {
  return (APP_LANGUAGE_CODES as readonly string[]).includes(value);
}
