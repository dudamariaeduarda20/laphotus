"use client";

import Link from "next/link";
import SearchEventBar from "@/components/SearchEventBar";
import RecentEvents from "@/components/RecentEvents";
import Grainient from "@/components/Grainient";
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
      {/* Hero — animated gradient background with overlay content */}
      <section className="relative text-white min-h-screen flex items-center justify-center pb-0">
        <div className="absolute inset-0">
          <Grainient
            color1="#051f3d"
            color2="#09419b"
            color3="#1a5fa0"
            timeSpeed={0.8}
            colorBalance={0.1}
            warpStrength={0.8}
            warpFrequency={3.5}
            warpSpeed={1.5}
            warpAmplitude={40.0}
            blendAngle={-15}
            blendSoftness={0.08}
            rotationAmount={300.0}
            noiseScale={1.8}
            grainAmount={0.08}
            grainScale={1.5}
            grainAnimated={false}
            contrast={1.3}
            gamma={1.0}
            saturation={0.95}
            centerX={0.0}
            centerY={-0.1}
            zoom={1.2}
          />
        </div>
        <div className="relative container-editorial w-full text-center pt-16 pb-24 px-6 space-y-12">
          <h1
            style={{ color: "#ffffff" }}
            className="font-serif font-bold uppercase text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight"
          >
            {t("home.hero.title")}
          </h1>
          <p className="font-sans text-lg text-white/80 max-w-2xl mx-auto">
            {t("home.hero.subtitle")}
          </p>

          <SearchEventBar />
        </div>
      </section>

      {/* Categories — separate white section */}
      <section className="bg-white text-gray-900 py-16 px-6">
        <div className="container-editorial w-full text-center space-y-8">
          <h2
            style={{ color: "#09419b" }}
            className="font-serif font-bold uppercase text-2xl sm:text-3xl tracking-tight"
          >
            {t("home.categories.title")}
          </h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {EVENT_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/photos?sport=${encodeURIComponent(c.value)}`}
                className="px-5 py-2 bg-[#f0bf38] text-[#09419b] rounded-full text-sm font-medium font-sans hover:bg-[#f7d15f] transition"
              >
                {t(c.labelKey)}
              </Link>
            ))}
          </div>
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
