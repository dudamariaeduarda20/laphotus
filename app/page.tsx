"use client";

import Link from "next/link";
import SearchEventBar from "@/components/SearchEventBar";
import RecentEvents from "@/components/RecentEvents";
import Grainient from "@/components/Grainient";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Home() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isPhotographer, isOrganizer, isAdmin } = useAuth();
  const isClient = isAuthenticated && !isPhotographer && !isOrganizer && !isAdmin;

  const sellFeatures = [
    { icon: "📸", titleKey: "home.sell.noFee.title", descKey: "home.sell.noFee.desc" },
    { icon: "💰", titleKey: "home.sell.control.title", descKey: "home.sell.control.desc" },
    { icon: "🌐", titleKey: "home.sell.site.title", descKey: "home.sell.site.desc" },
    { icon: "⚡", titleKey: "home.sell.speed.title", descKey: "home.sell.speed.desc" },
  ];

  return (
    <div>
      {/* Welcome banner for logged-in clients */}
      {isAuthenticated && isClient && (
        <div className="bg-[#f0bf38]/10 border-b-2 border-[#f0bf38] px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-lg font-semibold text-[#09419b]">
              {t("home.welcome", "Olá")}, {user?.name}! {t("home.welcomeBack", "Bem-vindo de volta.")}
            </p>
          </div>
        </div>
      )}

      {/* Hero — animated gradient with white text */}
      <section className="relative text-white min-h-screen flex items-center justify-center overflow-hidden">
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
        <div className="relative w-full max-w-6xl mx-auto px-6 py-24 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="font-serif font-bold text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-tight">
              {t("home.hero.title")}
            </h1>
            <p className="font-sans text-lg text-white/85 max-w-3xl mx-auto leading-relaxed">
              {t("home.hero.subtitle")}
            </p>
          </div>
          <div className="pt-8">
            <SearchEventBar />
          </div>
        </div>
      </section>

      {/* Categories — clean light section */}
      <section className="bg-[#f5f5f5] py-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div>
            <h2 className="font-serif font-bold text-4xl text-[#09419b] mb-3">
              {t("home.categories.title")}
            </h2>
            <p className="text-[#666] text-lg max-w-2xl mx-auto">
              {t("home.categories.subtitle", "Encontre fotos dos seus desportos favoritos")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {EVENT_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/photos?sport=${encodeURIComponent(c.value)}`}
                className="px-6 py-3 bg-[#f0bf38] text-[#09419b] rounded-lg text-sm font-semibold font-sans hover:bg-[#f7d15f] hover:shadow-lg transition-all duration-200"
              >
                {t(c.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent events — RecentEvents component */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <RecentEvents />
        </div>
      </section>

      {/* Stats — highlighted section with color accent */}
      <section className="bg-[#09419b] text-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif font-bold text-4xl text-center mb-16">
            {t("home.stats.title", "Números que falam por si")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="text-5xl font-bold text-[#f0bf38]">+5 mil</div>
              <p className="text-lg text-white/90 font-sans">{t("home.stats.photographers")}</p>
            </div>
            <div className="text-center space-y-3 border-l border-r border-white/20">
              <div className="text-5xl font-bold text-[#f0bf38]">+12 mil</div>
              <p className="text-lg text-white/90 font-sans">{t("home.stats.events")}</p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-5xl font-bold text-[#f0bf38]">+8 M</div>
              <p className="text-lg text-white/90 font-sans">{t("home.stats.photos")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sell Features — light section with cards */}
      <section className="bg-[#f5f5f5] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center">
            <h2 className="font-serif font-bold text-4xl text-[#09419b] mb-4">
              {t("home.sell.title")}
            </h2>
            <p className="text-[#666] text-lg max-w-2xl mx-auto">
              {t("home.sell.subtitle", "Comece a vender e ganhe com suas melhores fotos")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {sellFeatures.map((f) => (
              <div
                key={f.titleKey}
                className="bg-white rounded-xl p-8 shadow-soft hover:shadow-soft-hover transition-shadow duration-300 border-t-4 border-[#f0bf38]"
              >
                <div className="text-5xl mb-6">{f.icon}</div>
                <h3 className="font-sans font-bold text-xl text-[#333] mb-3">
                  {t(f.titleKey)}
                </h3>
                <p className="text-[#666] text-base leading-relaxed">
                  {t(f.descKey)}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <Link
              href="/auth/register"
              className="inline-block px-8 py-4 bg-[#ff2f92] text-white rounded-lg font-semibold font-sans hover:opacity-90 hover:shadow-lg transition-all duration-200 text-lg"
            >
              {t("home.sell.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA section — dark blue with pink button */}
      <section className="bg-[#09419b] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="font-serif font-bold text-4xl leading-tight">
            {t("home.cta.title", "Pronto para começar?")}
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            {t("home.cta.desc", "Junte-se a milhares de fotógrafos que já estão a ganhar dinheiro com a Laphotus")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-[#ff2f92] text-white rounded-lg font-semibold font-sans hover:opacity-90 hover:shadow-lg transition-all duration-200"
            >
              {t("auth.register")}
            </Link>
            <Link
              href="/photos"
              className="px-8 py-4 bg-white/10 text-white border-2 border-white rounded-lg font-semibold font-sans hover:bg-white/20 transition-all duration-200"
            >
              {t("home.cta.browse", "Explorar fotos")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
