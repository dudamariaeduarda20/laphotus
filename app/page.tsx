"use client";

import Link from "next/link";
import SearchEventBar from "@/components/SearchEventBar";
import RecentEvents from "@/components/RecentEvents";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function Home() {
  const { t } = useTranslation();

  const sellFeatures = [
    { icon: "🚫", titleKey: "home.sell.noFee.title", descKey: "home.sell.noFee.desc" },
    { icon: "🎯", titleKey: "home.sell.control.title", descKey: "home.sell.control.desc" },
    { icon: "🌐", titleKey: "home.sell.site.title", descKey: "home.sell.site.desc" },
    { icon: "⚡", titleKey: "home.sell.speed.title", descKey: "home.sell.speed.desc" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {t("home.hero.title")}
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            {t("home.hero.subtitle")}
          </p>
          <SearchEventBar />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {t("home.categories.title")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/photos?sport=${encodeURIComponent(c.value)}`}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 transition flex items-center gap-2"
            >
              <span>{c.icon}</span>
              {t(c.labelKey)}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent events */}
      <RecentEvents />

      {/* Stats */}
      <section className="bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600">+5 mil</div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">{t("home.stats.photographers")}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600">+12 mil</div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">{t("home.stats.events")}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600">+8 milhões</div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">{t("home.stats.photos")}</div>
          </div>
        </div>
      </section>

      {/* Sell section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("home.sell.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t("home.sell.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {sellFeatures.map((f) => (
            <div
              key={f.titleKey}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t(f.titleKey)}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition"
          >
            {t("home.sell.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
