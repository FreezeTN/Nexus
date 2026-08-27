import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, Language } from './languages';

export const LANGUAGE_STORAGE_KEY = 'nexus_language_preference';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  currentLanguageObj: Language;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  currentLanguageObj: SUPPORTED_LANGUAGES[0],
  t: (_key: string, defaultText?: string) => defaultText || '',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        return stored;
      }
      const browserLang = navigator.language?.slice(0, 2)?.toLowerCase();
      if (browserLang && SUPPORTED_LANGUAGES.some((l) => l.code === browserLang)) {
        return browserLang;
      }
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: string) => {
    if (SUPPORTED_LANGUAGES.some((l) => l.code === lang)) {
      setLanguageState(lang);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch {}
    }
  };

  const currentLanguageObj = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLanguageObj, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
