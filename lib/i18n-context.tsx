'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { type Locale, type TranslationKey, t as translate } from './i18n';

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}>({ locale: 'en', setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('mest-locale') as Locale | null;
    if (saved) setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('mest-locale', l);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: (k) => translate(k, locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
