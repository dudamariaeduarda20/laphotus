"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function OrganizerLandingPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="container-editorial section-lg text-center border-b border-[#ddd]">
        <h1 className="font-serif text-5xl sm:text-6xl text-[#09419b] mb-6">
          {t("landing.organizer.hero.title")}
        </h1>
        <p className="font-sans text-lg text-[#666] max-w-2xl mx-auto mb-10">
          {t("landing.organizer.hero.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register?type=organizador" className="btn-primary">
            {t("landing.organizer.hero.cta")}
          </Link>
          <Link href="/auth/login?type=organizador" className="btn-secondary">
            {t("landing.organizer.hero.ctaSecondary")}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="container-editorial section-md">
        <h2 className="font-serif text-3xl text-[#09419b] text-center mb-12">
          {t("landing.organizer.how.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: "📅", titleKey: "landing.organizer.how.step1.title", descKey: "landing.organizer.how.step1.desc" },
            { icon: "🤝", titleKey: "landing.organizer.how.step2.title", descKey: "landing.organizer.how.step2.desc" },
            { icon: "📊", titleKey: "landing.organizer.how.step3.title", descKey: "landing.organizer.how.step3.desc" },
          ].map((step, i) => (
            <div key={i} className="card-minimal p-8 text-center">
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="font-sans font-bold text-[#333] mb-2">{t(step.titleKey)}</h3>
              <p className="text-[#666] text-sm">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container-editorial section-md border-t border-[#ddd]">
        <h2 className="font-serif text-3xl text-[#09419b] text-center mb-12">
          {t("landing.organizer.benefits.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            { icon: "💵", titleKey: "landing.organizer.benefits.monetize.title", descKey: "landing.organizer.benefits.monetize.desc" },
            { icon: "🗺️", titleKey: "landing.organizer.benefits.marketplace.title", descKey: "landing.organizer.benefits.marketplace.desc" },
            { icon: "📈", titleKey: "landing.organizer.benefits.analytics.title", descKey: "landing.organizer.benefits.analytics.desc" },
            { icon: "🔒", titleKey: "landing.organizer.benefits.control.title", descKey: "landing.organizer.benefits.control.desc" },
          ].map((b, i) => (
            <div key={i} className="card-minimal p-8">
              <div className="text-3xl mb-4">{b.icon}</div>
              <h3 className="font-sans font-bold text-[#333] mb-2">{t(b.titleKey)}</h3>
              <p className="text-[#666] text-sm">{t(b.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Marketplace teaser */}
      <section className="container-editorial section-md text-center border-t border-[#ddd]">
        <h2 className="font-serif text-3xl text-[#09419b] mb-4">
          {t("landing.organizer.marketplace.title")}
        </h2>
        <p className="text-[#666] max-w-2xl mx-auto mb-8">
          {t("landing.organizer.marketplace.desc")}
        </p>
        <Link href="/photos" className="btn-primary">
          {t("landing.organizer.marketplace.cta")}
        </Link>
      </section>

      {/* Final CTA */}
      <section className="bg-[#09419b] text-white section-lg">
        <div className="container-editorial text-center">
          <h2 className="font-serif text-4xl mb-4">
            {t("landing.organizer.final.title")}
          </h2>
          <p className="text-[#e8f0ff] mb-8">
            {t("landing.organizer.final.subtitle")}
          </p>
          <Link href="/auth/register?type=organizador" className="inline-block bg-white text-[#09419b] px-8 py-3 font-bold rounded hover:bg-[#f5f5f5] transition">
            {t("landing.organizer.final.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
