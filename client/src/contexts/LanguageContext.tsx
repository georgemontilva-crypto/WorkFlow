/**
 * Language Context - Sistema de internacionalización
 * Design Philosophy: Apple Minimalism
 */

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { es } from '@/locales/es';
import { en } from '@/locales/en';

type Language = 'es' | 'en';
type Translations = typeof es;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  
  const language = (i18n.language.split('-')[0] as Language) || 'es';
  
  const translations: Record<Language, Translations> = {
    es,
    en,
  };

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('workflow-language', lang);
  };

  // Sync with Crisp when language changes
  useEffect(() => {
    if (window.$crisp && window.$crisp.is) {
      window.$crisp.push(['set', 'session:data', [['language', language]]]);
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
