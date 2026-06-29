"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export const SUPPORTED_LOCALES = ["pt", "en", "es", "fr", "de"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, { flag: string; name: string }> = {
  pt: { flag: "🇵🇹", name: "Português" },
  en: { flag: "🇬🇧", name: "English" },
  es: { flag: "🇪🇸", name: "Español" },
  fr: { flag: "🇫🇷", name: "Français" },
  de: { flag: "🇩🇪", name: "Deutsch" },
};

type Translations = Record<string, string>;

interface TranslationContextType {
  t: (key: string, fallback?: string) => string;
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType>({
  t: (k) => k,
  locale: "pt",
  setLocale: async () => {},
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    // Read stored locale — localStorage first, then cookie
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("locale");
    } catch {}
    if (!stored) {
      const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      if (match) stored = match[1];
    }
    const init = SUPPORTED_LOCALES.includes(stored as Locale) ? (stored as Locale) : "pt";
    setLocaleState(init);

    // If logged in, sync with DB preference
    fetch("/api/user/language")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.language && SUPPORTED_LOCALES.includes(data.language as Locale)) {
          setLocaleState(data.language as Locale);
          try { localStorage.setItem("locale", data.language); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/locales/${locale}.json`)
      .then((r) => r.json())
      .then((data: Translations) => setTranslations(data))
      .catch(() => {});
  }, [locale]);

  const t = (key: string, fallback?: string): string =>
    translations[key] ?? fallback ?? key;

  const setLocale = async (newLocale: Locale): Promise<void> => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);
    try { localStorage.setItem("locale", newLocale); } catch {}
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    try {
      await fetch("/api/user/language", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLocale }),
      });
    } catch {}
  };

  return (
    <TranslationContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export const useTranslation = () => useContext(TranslationContext);
