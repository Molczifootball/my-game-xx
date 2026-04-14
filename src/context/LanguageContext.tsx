"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Locale } from '@/utils/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (lang: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load locale from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lechia_locale') as Locale;
    if (saved && (saved === 'en' || saved === 'pl')) {
      setLocaleState(saved);
    } else {
      // Default to browser language if available
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'pl') setLocaleState('pl');
    }
  }, []);

  const setLocale = (lang: Locale) => {
    setLocaleState(lang);
    localStorage.setItem('lechia_locale', lang);
  };

  /**
   * Translates a dot-notated key (e.g. "ui.map") into the current locale string.
   */
  const t = useCallback((path: string): string => {
    const keys = path.split('.');
    let current: any = translations[locale];

    for (const key of keys) {
      if (current[key] === undefined) {
        // Fallback to English if key missing in Polish
        let fallback: any = translations['en'];
        for (const fkey of keys) {
          if (fallback[fkey] === undefined) return path;
          fallback = fallback[fkey];
        }
        return typeof fallback === 'string' ? fallback : path;
      }
      current = current[key];
    }

    return typeof current === 'string' ? current : path;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
