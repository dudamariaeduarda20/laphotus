"use client";

import Link from "next/link";
import SearchEventBar from "@/components/SearchEventBar";
import RecentEvents from "@/components/RecentEvents";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function Home() {
  const { t } = useTranslation();

  const sellFeatures = [
    { icon: "📸", titleKey: "home.sell.noFee.title", descKey: "home.sell.noFee.desc" },
    { icon: "💰", titleKey: "home.sell.control.title", descKey: "home.sell.control.desc" },
    { icon: "🌐", titleKey: "home.sell.site.title", descKey: "home.sell.site.desc" },
    { icon: "⚡", titleKey: "home.sell.speed.title", descKey: "home.sell.speed.desc" },
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="container-editorial section-lg text-center">
        <div className="mb-8">
          <h1 className="font-serif text-5xl sm:text-6xl text-[#09419b] mb-6">
            {t("home.hero.title")}
          </h1>
          <p className="font-sans text-lg text-[#666] max-w-2xl mx-auto mb-12">
            {t("home.hero.subtitle")}
          </p>
        </div>
        <SearchEventBar />
      </section>

      {/* Categories */}
      <section className="container-editorial section-md border-t border-[#ddd]">
        <h2 className="font-serif text-3xl text-[#09419b] text-center mb-8">
          {t("home.categories.title")}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {EVENT_CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/photos?sport=${encodeURIComponent(c.value)}`}
              className="px-4 py-2 bg-[#f5f5f5] text-[#333] rounded-full text-sm font-sans hover:bg-[#09419b] hover:text-white transition flex items-center gap-2"
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
      <section className="container-editorial section-md border-t border-[#ddd]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="card-minimal p-8">
            <div className="text-4xl font-bold text-[#09419b] mb-2">+5 mil</div>
            <div className="text-[#666]">{t("home.stats.photographers")}</div>
          </div>
          <div className="card-minimal p-8">
            <div className="text-4xl font-bold text-[#09419b] mb-2">+12 mil</div>
            <div className="text-[#666]">{t("home.stats.events")}</div>
          </div>
          <div className="card-minimal p-8">
            <div className="text-4xl font-bold text-[#09419b] mb-2">+8 M</div>
            <div className="text-[#666]">{t("home.stats.photos")}</div>
          </div>
        </div>
      </section>

      {/* Sell Features */}
      <section className="container-editorial section-lg border-t border-[#ddd]">
        <h2 className="font-serif text-3xl text-[#09419b] text-center mb-12">
          {t("home.sell.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          {sellFeatures.map((f) => (
            <div key={f.titleKey} className="card-minimal p-8">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-sans font-bold text-[#333] mb-2">{t(f.titleKey)}</h3>
              <p className="text-[#666] text-sm">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/auth/register" className="btn-primary">
            {t("home.sell.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
