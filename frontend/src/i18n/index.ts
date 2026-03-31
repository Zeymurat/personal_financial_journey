import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './resources';
import { APP_LANGUAGE_CODES } from '../locales/languages';

export const I18N_NAMESPACES = [
  'common',
  'settings',
  'agenda',
  'sidebar',
  'notifications',
  'dashboard',
  'auth',
  'converter',
  'reports',
  'calculator',
  'trackCompare',
  'transactions',
  'investments',
  'shared'
] as const;
export type I18nNamespace = (typeof I18N_NAMESPACES)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'tr',
    supportedLngs: [...APP_LANGUAGE_CODES],
    ns: [...I18N_NAMESPACES],
    defaultNS: 'settings',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language;

export default i18n;
