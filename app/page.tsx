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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #09419b 0%, #8B5CF6 50%, #06B6D4 100%)" }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#06B6D4] rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
              {t("home.hero.title")}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t("home.hero.subtitle")}
            </p>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <SearchEventBar />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          {t("home.categories.title")}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {EVENT_CATEGORIES.map((c, i) => (
            <Link
              key={c.value}
              href={`/photos?sport=${encodeURIComponent(c.value)}`}
              className="px-5 py-3 bg-white dark:bg-gray-800/60 glass hover:glass-dark rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-[#09419b] dark:hover:text-[#6ba3ff] transition-smooth hover:shadow-lg flex items-center gap-2"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="text-lg">{c.icon}</span>
              {t(c.labelKey)}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent events */}
      <RecentEvents />

      {/* Stats */}
      <section className="relative py-16 bg-gradient-to-r from-[#09419b]/5 via-[#8B5CF6]/5 to-[#06B6D4]/5 dark:from-[#09419b]/10 dark:via-[#8B5CF6]/10 dark:to-[#06B6D4]/10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { value: "+5 mil", label: "home.stats.photographers", color: "from-[#09419b]" },
            { value: "+12 mil", label: "home.stats.events", color: "from-[#8B5CF6]" },
            { value: "+8 M", label: "home.stats.photos", color: "from-[#06B6D4]" },
          ].map((stat, i) => (
            <div
              key={i}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 glass hover:glass-dark transition-smooth border border-gray-100 dark:border-gray-700/50"
            >
              <div className={`bg-gradient-to-r ${stat.color} to-transparent opacity-0 group-hover:opacity-10 absolute inset-0 rounded-2xl transition-smooth`}></div>
              <div className="relative text-center">
                <div className={`text-5xl sm:text-6xl font-bold bg-gradient-to-r ${stat.color} to-[#06B6D4] bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-medium">{t(stat.label)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sell section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t("home.sell.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t("home.sell.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {sellFeatures.map((f, i) => (
            <div
              key={f.titleKey}
              className="group relative p-8 rounded-2xl bg-white dark:bg-gray-800/60 glass hover:glass-dark transition-smooth border border-gray-100 dark:border-gray-700/50 hover:shadow-xl hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#09419b]/0 via-[#8B5CF6]/0 to-[#06B6D4]/0 group-hover:from-[#09419b]/5 group-hover:via-[#8B5CF6]/5 group-hover:to-[#06B6D4]/5 rounded-2xl transition-smooth"></div>
              <div className="relative text-center">
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{t(f.titleKey)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t(f.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/auth/register"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#09419b] to-[#8B5CF6] text-white rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#09419b]/50 hover:scale-105 transition-smooth"
          >
            {t("home.sell.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
