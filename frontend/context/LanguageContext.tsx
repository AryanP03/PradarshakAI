'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, TRANSLATIONS } from '@/lib/translations';
import { getLanguageConfig, isValidLanguageCode, LanguageCode } from '@/lib/languages';

export type LanguageMode = LanguageCode | 'auto';

interface LanguageContextType {
  lang: Language;
  language: Language;
  selectedMode: LanguageMode;
  isAuto: boolean;
  setLang: (mode: LanguageMode) => void;
  updateDetectedLang: (detectedCode: string, probability?: number | null) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  language: 'en',
  selectedMode: 'auto',
  isAuto: true,
  setLang: () => {},
  updateDetectedLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

function getLanguageCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setLanguageCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  // 1-year expiration, SameSite=Lax, Path=/
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [selectedMode, setSelectedMode] = useState<LanguageMode>('en');

  useEffect(() => {
    // 1. Check cookies first (SSR / pre-hydration source of truth)
    const cookieMode = getLanguageCookie('app_lang_mode') as LanguageMode | null;
    const cookieLang = getLanguageCookie('app_lang') as Language | null;

    // 2. Check localStorage fallback
    const savedMode = (cookieMode && isValidLanguageCode(cookieMode))
      ? cookieMode
      : (localStorage.getItem('app_lang_mode') as LanguageMode | null);

    const savedLang = (cookieLang && isValidLanguageCode(cookieLang))
      ? cookieLang
      : (localStorage.getItem('app_lang') as Language | null);

    if (savedMode && isValidLanguageCode(savedMode)) {
      setSelectedMode(savedMode);
      const resolved = getLanguageConfig(savedMode).id;
      setLangState(resolved);
      setLanguageCookie('app_lang_mode', savedMode);
      setLanguageCookie('app_lang', resolved);
    } else if (savedLang && isValidLanguageCode(savedLang)) {
      setSelectedMode(savedLang);
      const resolved = getLanguageConfig(savedLang).id;
      setLangState(resolved);
      setLanguageCookie('app_lang_mode', savedLang);
      setLanguageCookie('app_lang', resolved);
    } else {
      setSelectedMode('en');
      setLangState('en');
      setLanguageCookie('app_lang_mode', 'en');
      setLanguageCookie('app_lang', 'en');
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-lang', lang);
    }
  }, [lang]);

  const isAuto = selectedMode === 'auto';

  const setLang = useCallback((newMode: LanguageMode) => {
    setSelectedMode(newMode);
    localStorage.setItem('app_lang_mode', newMode);
    setLanguageCookie('app_lang_mode', newMode);

    if (newMode !== 'auto') {
      const cfg = getLanguageConfig(newMode);
      setLangState(cfg.id);
      localStorage.setItem('app_lang', cfg.id);
      setLanguageCookie('app_lang', cfg.id);
    }
    window.dispatchEvent(new Event('app_language_changed'));
  }, []);

  const updateDetectedLang = useCallback(
    (detectedCode: string, probability?: number | null) => {
      // Ignore weak or ambiguous speech detection
      if (probability != null && probability < 0.6) return;
      if (!detectedCode || !isValidLanguageCode(detectedCode)) return;

      const cfg = getLanguageConfig(detectedCode);
      setSelectedMode(cfg.id);
      localStorage.setItem('app_lang_mode', cfg.id);
      localStorage.setItem('app_lang', cfg.id);
      setLanguageCookie('app_lang_mode', cfg.id);
      setLanguageCookie('app_lang', cfg.id);
      setLangState((prev) => {
        if (prev !== cfg.id) {
          window.dispatchEvent(new Event('app_language_changed'));
          return cfg.id;
        }
        return prev;
      });
    },
    []
  );

  function t(key: string, fallback?: string): string {
    const table = TRANSLATIONS[lang] || TRANSLATIONS.en;
    if (table[key]) return table[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return fallback || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, language: lang, selectedMode, isAuto, setLang, updateDetectedLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
