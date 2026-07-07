"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function OrganizerLandingPage() {
  const { t } = useTranslation();

  const steps = [
    { icon: "📅", titleKey: "landing.organizer.how.step1.title", descKey: "landing.organizer.how.step1.desc" },
    { icon: "🤝", titleKey: "landing.organizer.how.step2.title", descKey: "landing.organizer.how.step2.desc" },
    { icon: "📊", titleKey: "landing.organizer.how.step3.title", descKey: "landing.organizer.how.step3.desc" },
  ];

  const benefits = [
    { icon: "💵", titleKey: "landing.organizer.benefits.monetize.title", descKey: "landing.organizer.benefits.monetize.desc" },
    { icon: "🗺️", titleKey: "landing.organizer.benefits.marketplace.title", descKey: "landing.organizer.benefits.marketplace.desc" },
    { icon: "📈", titleKey: "landing.organizer.benefits.analytics.title", descKey: "landing.organizer.benefits.analytics.desc" },
    { icon: "🔒", titleKey: "landing.organizer.benefits.control.title", descKey: "landing.organizer.benefits.control.desc" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #09419b 0%, #8B5CF6 50%, #06B6D4 100%)" }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#06B6D4] rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-24 sm:py-32 text-center">
          <div className="animate-fade-in">
            <img src="/logo-full.svg" alt="LAPHOTUS" className="h-20 mx-auto mb-10 drop-shadow-lg" />
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              {t("landing.organizer.hero.title")}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t("landing.organizer.hero.subtitle")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link
              href="/auth/register?type=organizador"
              className="px-8 py-4 bg-white text-[#09419b] font-bold rounded-full text-lg hover:shadow-2xl hover:shadow-white/50 hover:scale-105 transition-smooth"
            >
              {t("landing.organizer.hero.cta")}
            </Link>
            <Link
              href="/auth/login?type=organizador"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-full text-lg hover:bg-white/10 hover:backdrop-blur transition-smooth"
            >
              {t("landing.organizer.hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white text-center mb-16">
          {t("landing.organizer.how.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.titleKey} className="group relative p-8 rounded-2xl bg-white/80 dark:bg-gray-800/40 backdrop-blur-md hover:bg-white/90 dark:hover:bg-gray-800/60 transition-smooth border border-white/40 dark:border-white/10 hover:shadow-xl hover:-translate-y-1">
              <div className="relative text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#09419b] via-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:shadow-2xl group-hover:shadow-[#09419b]/50 transition-smooth">
                  {i + 1}
                </div>
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{s.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{t(s.titleKey)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t(s.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vantagens */}
      <section className="relative py-20 bg-gradient-to-r from-[#09419b]/5 via-[#8B5CF6]/5 to-[#06B6D4]/5 dark:from-[#09419b]/10 dark:via-[#8B5CF6]/10 dark:to-[#06B6D4]/10">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white text-center mb-16">
            {t("landing.organizer.benefits.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.titleKey} className="group relative p-8 rounded-2xl bg-white/80 dark:bg-gray-800/40 backdrop-blur-md hover:bg-white/90 dark:hover:bg-gray-800/60 transition-smooth border border-white/40 dark:border-white/10 hover:shadow-xl hover:-translate-y-1">
                <div className="relative text-center">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{b.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{t(b.titleKey)}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t(b.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace de fotógrafos */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          {t("landing.organizer.marketplace.title")}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12">
          {t("landing.organizer.marketplace.desc")}
        </p>
        <Link
          href="/photos"
          className="inline-block px-10 py-4 bg-gradient-to-r from-[#09419b] to-[#8B5CF6] text-white font-bold rounded-full text-lg hover:shadow-2xl hover:shadow-[#09419b]/50 hover:scale-105 transition-smooth"
        >
          {t("landing.organizer.marketplace.cta")}
        </Link>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden text-white py-24" style={{ background: "linear-gradient(135deg, #09419b 0%, #8B5CF6 50%, #06B6D4 100%)" }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#06B6D4] rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">{t("landing.organizer.final.title")}</h2>
          <p className="text-lg sm:text-xl text-white/90 mb-10">{t("landing.organizer.final.subtitle")}</p>
          <Link
            href="/auth/register?type=organizador"
            className="inline-block px-10 py-4 bg-white text-[#09419b] font-bold rounded-full text-lg hover:shadow-2xl hover:shadow-white/50 hover:scale-105 transition-smooth"
          >
            {t("landing.organizer.final.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
