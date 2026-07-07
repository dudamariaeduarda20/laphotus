"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/lib/contexts/TranslationContext";

export default function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = LOCALE_LABELS[locale];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 transition"
        aria-label="Select language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          {SUPPORTED_LOCALES.map((l) => {
            const info = LOCALE_LABELS[l as Locale];
            return (
              <button
                key={l}
                onClick={() => { setLocale(l as Locale); setOpen(false); }}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition ${
                  locale === l ? "font-semibold text-[#09419b]" : "text-gray-700"
                }`}
              >
                <span className="text-base">{info.flag}</span>
                <span>{info.name}</span>
                {locale === l && (
                  <svg className="w-3.5 h-3.5 ml-auto text-[#09419b]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
