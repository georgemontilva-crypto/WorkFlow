/**
 * Language Context - Sistema de internacionalización
 * Design Philosophy: Apple Minimalism
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('workflow-language');
    return (saved as Language) || 'es';
  });

  const translations: Record<Language, Translations> = {
    es,
    en,
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('workflow-language', lang);
  };

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
