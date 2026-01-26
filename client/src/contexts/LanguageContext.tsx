/**
 * Language Context - Gestiona el idioma de la aplicación
 * Usa traducción automática con OpenAI
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translateText, translateBatch, preCacheCommonTranslations } from '@/services/translation';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => string;
  tAsync: (text: string) => Promise<string>;
  tBatch: (texts: string[]) => Promise<string[]>;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Cache local para traducciones instantáneas
const localCache = new Map<string, string>();

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Obtener idioma guardado o usar español por defecto
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('finwrk-language');
    return (saved as Language) || 'es';
  });

  const [isTranslating, setIsTranslating] = useState(false);

  // Guardar idioma en localStorage
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('finwrk-language', lang);
    
    // Pre-cachear traducciones comunes cuando cambia el idioma
    preCacheCommonTranslations(lang);
    
    // Sync with Crisp when language changes
    if (window.$crisp && window.$crisp.is) {
      window.$crisp.push(['set', 'session:data', [['language', lang]]]);
    }
  }, []);

  // Pre-cachear al montar
  useEffect(() => {
    preCacheCommonTranslations(language);
  }, []);

  /**
   * Traducción síncrona (usa caché local)
   * Si no está en caché, retorna el texto original y traduce en background
   */
  const t = useCallback((text: string): string => {
    if (!text || text.trim() === '') return text;

    // Si ya estamos en español, retornar directo
    if (language === 'es') return text;

    const cacheKey = `${text}:${language}`;
    
    // Si está en caché local, retornar
    if (localCache.has(cacheKey)) {
      return localCache.get(cacheKey)!;
    }

    // Traducir en background y actualizar caché
    translateText(text, language, 'es')
      .then(translated => {
        localCache.set(cacheKey, translated);
      })
      .catch(err => console.error('Translation error:', err));

    // Retornar texto original mientras se traduce
    return text;
  }, [language]);

  /**
   * Traducción asíncrona (espera la traducción)
   */
  const tAsync = useCallback(async (text: string): Promise<string> => {
    if (!text || text.trim() === '') return text;
    if (language === 'es') return text;

    const cacheKey = `${text}:${language}`;
    
    if (localCache.has(cacheKey)) {
      return localCache.get(cacheKey)!;
    }

    setIsTranslating(true);
    try {
      const translated = await translateText(text, language, 'es');
      localCache.set(cacheKey, translated);
      return translated;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  /**
   * Traducción en batch (múltiples textos)
   */
  const tBatch = useCallback(async (texts: string[]): Promise<string[]> => {
    if (language === 'es') return texts;

    setIsTranslating(true);
    try {
      const translated = await translateBatch(texts, language, 'es');
      
      // Actualizar caché local
      texts.forEach((text, i) => {
        const cacheKey = `${text}:${language}`;
        localCache.set(cacheKey, translated[i]);
      });

      return translated;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tAsync,
        tBatch,
        isTranslating,
      }}
    >
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
