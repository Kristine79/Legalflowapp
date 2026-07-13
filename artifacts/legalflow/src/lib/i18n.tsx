import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { ru, type I18n } from './i18n/ru';
import { en } from './i18n/en';

export type { I18n } from './i18n/ru';
export type Language = 'ru' | 'en';
export const DEFAULT_LANGUAGE: Language = 'ru';
export const SUPPORTED_LANGUAGES: Language[] = ['ru', 'en'];

export const LANGUAGE_LABELS: Record<Language, string> = {
  ru: 'Русский',
  en: 'English',
};

const translations: Record<Language, I18n> = { ru, en };

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: I18n;
}

const I18nContext = createContext<I18nContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: ru,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    const stored = localStorage.getItem('language') as Language | null;
    return SUPPORTED_LANGUAGES.includes(stored as Language) ? (stored as Language) : DEFAULT_LANGUAGE;
  });

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', next);
    }
  };

  const t = useMemo(() => translations[language] ?? ru, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useT must be used inside LanguageProvider');
  }
  return ctx.t;
}

export function useLanguage(): { language: Language; setLanguage: (language: Language) => void } {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return { language: ctx.language, setLanguage: ctx.setLanguage };
}

// Legacy static export for modules that have not yet switched to the hook.
// Components that need live language switching should use useT() instead.
export const t = ru;
