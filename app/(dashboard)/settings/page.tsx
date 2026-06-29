"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/lib/contexts/TranslationContext";

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = async (newLocale: Locale) => {
    setSaving(true);
    await setLocale(newLocale);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("settings.title")}</h1>

      {/* Language section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("settings.language")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t("settings.language.desc")}</p>
          </div>
          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t("settings.language.saved")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUPPORTED_LOCALES.map((l) => {
            const info = LOCALE_LABELS[l as Locale];
            const isActive = locale === l;
            return (
              <button
                key={l}
                onClick={() => handleLanguageChange(l as Locale)}
                disabled={saving}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition text-left ${
                  isActive
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <span className="text-2xl">{info.flag}</span>
                <div>
                  <div className="font-medium">{info.name}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">{l}</div>
                </div>
                {isActive && (
                  <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
