import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

// Get saved language from localStorage or default to Spanish
const savedLanguage = typeof window !== 'undefined' ? (localStorage.getItem('language') || 'es') : 'es';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Save language to localStorage when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
