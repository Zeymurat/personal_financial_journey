import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Çevirileri doğrudan import et
import enTranslation from './locales/en/translation.json';
import trTranslation from './locales/tr/translation.json';
import ruTranslation from './locales/ru/translation.json';

// Kaynakları tanımla
const resources = {
  en: { translation: enTranslation },
  tr: { translation: trTranslation },
  ru: { translation: ruTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React zaten XSS'den korunuyor
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // Suspense kullanmıyorsak false yapalım
    },
  });

export default i18n;
