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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <section style={{ background: "linear-gradient(to bottom right, #09419b, #0a2d6e)" }} className="text-white">
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {t("landing.organizer.hero.title")}
          </h1>
          <p className="text-lg text-[#e8f0ff] mb-10 max-w-2xl mx-auto">
            {t("landing.organizer.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register?type=organizador"
              className="px-8 py-3 bg-white text-[#09419b] font-bold rounded-lg hover:bg-[#e8f0ff] transition"
            >
              {t("landing.organizer.hero.cta")}
            </Link>
            <Link
              href="/auth/login?type=organizador"
              className="px-8 py-3 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition"
            >
              {t("landing.organizer.hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">
          {t("landing.organizer.how.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.titleKey} className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#e8f0ff] dark:bg-blue-900 flex items-center justify-center text-2xl font-bold text-[#09419b] dark:text-blue-300">
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
            {t("landing.organizer.benefits.title")}
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

      {/* Marketplace de fotógrafos */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t("landing.organizer.marketplace.title")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          {t("landing.organizer.marketplace.desc")}
        </p>
        <Link
          href="/photos"
          className="inline-block px-6 py-3 border border-[#09419b] text-[#09419b] dark:text-[#6ba3ff] font-semibold rounded-lg hover:bg-[#e8f0ff] dark:hover:bg-blue-950 transition"
        >
          {t("landing.organizer.marketplace.cta")}
        </Link>
      </section>

      {/* CTA final */}
      <section className="bg-[#09419b] text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-3">{t("landing.organizer.final.title")}</h2>
          <p className="text-[#e8f0ff] mb-8">{t("landing.organizer.final.subtitle")}</p>
          <Link
            href="/auth/register?type=organizador"
            className="inline-block px-8 py-3 bg-white text-[#09419b] font-bold rounded-lg hover:bg-[#e8f0ff] transition"
          >
            {t("landing.organizer.final.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
