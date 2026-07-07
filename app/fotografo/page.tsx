"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function PhotographerLandingPage() {
  const { t } = useTranslation();

  const steps = [
    { icon: "📸", titleKey: "landing.photographer.how.step1.title", descKey: "landing.photographer.how.step1.desc" },
    { icon: "⬆️", titleKey: "landing.photographer.how.step2.title", descKey: "landing.photographer.how.step2.desc" },
    { icon: "💰", titleKey: "landing.photographer.how.step3.title", descKey: "landing.photographer.how.step3.desc" },
  ];

  const benefits = [
    { icon: "💵", titleKey: "landing.photographer.benefits.income.title", descKey: "landing.photographer.benefits.income.desc" },
    { icon: "👁️", titleKey: "landing.photographer.benefits.exposure.title", descKey: "landing.photographer.benefits.exposure.desc" },
    { icon: "🗺️", titleKey: "landing.photographer.benefits.marketplace.title", descKey: "landing.photographer.benefits.marketplace.desc" },
    { icon: "🔒", titleKey: "landing.photographer.benefits.payment.title", descKey: "landing.photographer.benefits.payment.desc" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <section style={{ background: "linear-gradient(to bottom right, #09419b, #0a2d6e)" }} className="text-white">
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {t("landing.photographer.hero.title")}
          </h1>
          <p className="text-lg text-[#e8f0ff] mb-10 max-w-2xl mx-auto">
            {t("landing.photographer.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register?type=fotografo"
              className="px-8 py-3 bg-white text-[#09419b] font-bold rounded-lg hover:bg-[#e8f0ff] transition"
            >
              {t("landing.photographer.hero.cta")}
            </Link>
            <Link
              href="/auth/login?type=fotografo"
              className="px-8 py-3 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition"
            >
              {t("landing.photographer.hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">
          {t("landing.photographer.how.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.titleKey} className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#e8f0ff] dark:bg-[#0a2d6e] flex items-center justify-center text-2xl font-bold text-[#09419b] dark:text-[#6ba3ff]">
                {i + 1}
              </div>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t(s.titleKey)}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vantagens */}
      <section className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">
            {t("landing.photographer.benefits.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.titleKey} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t(b.titleKey)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t(b.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace de eventos */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t("landing.photographer.marketplace.title")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          {t("landing.photographer.marketplace.desc")}
        </p>
        <Link
          href="/photos"
          className="inline-block px-6 py-3 border border-[#09419b] text-[#09419b] dark:text-[#09419b] font-semibold rounded-lg hover:bg-[#e8f0ff] dark:hover:bg-[#0a2d6e] transition"
        >
          {t("landing.photographer.marketplace.cta")}
        </Link>
      </section>

      {/* CTA final */}
      <section className="bg-[#09419b] text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-3">{t("landing.photographer.final.title")}</h2>
          <p className="text-[#e8f0ff] mb-8">{t("landing.photographer.final.subtitle")}</p>
          <Link
            href="/auth/register?type=fotografo"
            className="inline-block px-8 py-3 bg-white text-[#09419b] font-bold rounded-lg hover:bg-[#e8f0ff] transition"
          >
            {t("landing.photographer.final.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
