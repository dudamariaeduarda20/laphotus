"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function PhotographerLandingPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="container-editorial section-lg text-center border-b border-[#ddd]">
        <h1 className="font-serif text-5xl sm:text-6xl text-[#09419b] mb-6">
          {t("landing.photographer.hero.title")}
        </h1>
        <p className="font-sans text-lg text-[#666] max-w-2xl mx-auto mb-10">
          {t("landing.photographer.hero.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register?type=fotografo" className="btn-primary">
            {t("landing.photographer.hero.cta")}
          </Link>
          <Link href="/auth/login?type=fotografo" className="btn-secondary">
            {t("landing.photographer.hero.ctaSecondary")}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="container-editorial section-md">
        <h2 className="font-serif text-3xl text-[#09419b] text-center mb-12">
          {t("landing.photographer.how.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: "📸", titleKey: "landing.photographer.how.step1.title", descKey: "landing.photographer.how.step1.desc" },
            { icon: "⬆️", titleKey: "landing.photographer.how.step2.title", descKey: "landing.photographer.how.step2.desc" },
            { icon: "💰", titleKey: "landing.photographer.how.step3.title", descKey: "landing.photographer.how.step3.desc" },
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
          {t("landing.photographer.benefits.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            { icon: "💵", titleKey: "landing.photographer.benefits.income.title", descKey: "landing.photographer.benefits.income.desc" },
            { icon: "👁️", titleKey: "landing.photographer.benefits.exposure.title", descKey: "landing.photographer.benefits.exposure.desc" },
            { icon: "🗺️", titleKey: "landing.photographer.benefits.marketplace.title", descKey: "landing.photographer.benefits.marketplace.desc" },
            { icon: "🔒", titleKey: "landing.photographer.benefits.payment.title", descKey: "landing.photographer.benefits.payment.desc" },
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
          {t("landing.photographer.marketplace.title")}
        </h2>
        <p className="text-[#666] max-w-2xl mx-auto mb-8">
          {t("landing.photographer.marketplace.desc")}
        </p>
        <Link href="/photos" className="btn-primary">
          {t("landing.photographer.marketplace.cta")}
        </Link>
      </section>

      {/* Final CTA */}
      <section className="bg-[#09419b] text-white section-lg">
        <div className="container-editorial text-center">
          <h2 className="font-serif text-4xl mb-4">
            {t("landing.photographer.final.title")}
          </h2>
          <p className="text-[#e8f0ff] mb-8">
            {t("landing.photographer.final.subtitle")}
          </p>
          <Link href="/auth/register?type=fotografo" className="inline-block bg-white text-[#09419b] px-8 py-3 font-bold rounded hover:bg-[#f5f5f5] transition">
            {t("landing.photographer.final.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
