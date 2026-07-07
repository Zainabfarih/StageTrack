import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  ar: { translation: ar },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    supportedLngs: ['fr', 'en', 'ar'],
    nonExplicitSupportedLngs: true,

    detection: {
      // Anglais par défaut : on ne lit que le choix sauvegardé,
      // sinon on retombe sur fallbackLng ('en').
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng) => lng.split('-')[0],
    },

    react: {
      useSuspense: false,
      // ✅ Forcer le re-render sur chaque changement de langue
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },

    interpolation: {
      escapeValue: false,
    },

    load: 'languageOnly',
    cleanCode: true,
    defaultNS: 'translation',
    ns: ['translation'],
  });

export default i18n;
