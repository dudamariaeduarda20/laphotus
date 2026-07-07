"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface AdvancedSearchModalProps {
  open: boolean;
  onClose: () => void;
}

/** Converte um preset de data num intervalo [from, to] (YYYY-MM-DD). */
function presetRange(preset: string): { from?: string; to?: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };
  switch (preset) {
    case "hoje":
      return { from: fmt(today), to: fmt(today) };
    case "ontem":
      return { from: fmt(daysAgo(1)), to: fmt(daysAgo(1)) };
    case "3":
      return { from: fmt(daysAgo(3)), to: fmt(today) };
    case "7":
      return { from: fmt(daysAgo(7)), to: fmt(today) };
    case "14":
      return { from: fmt(daysAgo(14)), to: fmt(today) };
    case "30":
      return { from: fmt(daysAgo(30)), to: fmt(today) };
    default:
      return {};
  }
}

const DATE_PRESETS = [
  { value: "hoje", labelKey: "search.preset.today" },
  { value: "ontem", labelKey: "search.preset.yesterday" },
  { value: "3", labelKey: "search.preset.3d" },
  { value: "7", labelKey: "search.preset.7d" },
  { value: "14", labelKey: "search.preset.14d" },
  { value: "30", labelKey: "search.preset.30d" },
];

export default function AdvancedSearchModal({
  open,
  onClose,
}: AdvancedSearchModalProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"data" | "categoria">("data");
  const [month, setMonth] = useState("");

  if (!open) return null;

  const go = (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    onClose();
    router.push(`/photos?${qs}`);
  };

  const submitMonth = () => {
    if (!month) return;
    // month = "YYYY-MM" -> intervalo do mês
    const [y, m] = month.split("-").map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0);
    go({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-lg text-gray-900">{t("search.advanced.title")}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setTab("data")}
            className={`flex-1 py-3 text-sm font-semibold ${
              tab === "data"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t("search.tab.date")}
          </button>
          <button
            onClick={() => setTab("categoria")}
            className={`flex-1 py-3 text-sm font-semibold ${
              tab === "categoria"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t("search.tab.category")}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === "data" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => go(presetRange(p.value) as Record<string, string>)}
                    className="px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition"
                  >
                    {t(p.labelKey)}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("search.month.label")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={submitMonth}
                    disabled={!month}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    {t("home.search.button")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENT_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => go({ sport: c.value })}
                  className="px-3 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition flex flex-col items-center gap-1"
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-xs text-center">{t(c.labelKey)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
