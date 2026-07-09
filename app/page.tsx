"use client";

import Link from "next/link";
import SearchEventBar from "@/components/SearchEventBar";
import RecentEvents from "@/components/RecentEvents";
import Grainient from "@/components/Grainient";
import CameraMockup from "@/components/CameraMockup";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";

interface MockupLastEdit {
  adminName: string;
  updatedAt: string;
}

export default function Home() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isPhotographer, isOrganizer, isAdmin } = useAuth();
  const isClient = isAuthenticated && !isPhotographer && !isOrganizer && !isAdmin;
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [mockupLastEdit, setMockupLastEdit] = useState<MockupLastEdit | null>(null);

  useEffect(() => {
    fetch("/api/mockup/last-edit")
      .then((res) => res.json())
      .then((data) => {
        if (data.adminName) setMockupLastEdit(data);
      })
      .catch(() => {});
  }, []);

  const faqItems = [
    { id: "1", q: "Como funciona a Laphotus?", a: "A Laphotus conecta fotógrafos de desportos com clientes que buscam fotos de alta qualidade dos seus eventos favoritos." },
    { id: "2", q: "Como vendo as minhas fotos?", a: "Faça upload das suas fotos após um evento, defina seus preços, e venda direto para os clientes. Receba 70% do valor de cada venda." },
    { id: "3", q: "Qual é a comissão?", a: "Laphotus cobra apenas 30% por venda. Sem mensalidade, sem taxa de foto não vendida. Pague só quando vende." },
    { id: "4", q: "Posso vender fotos de eventos passados?", a: "Sim! Se o evento está no catálogo da Laphotus, você pode fazer upload e vender fotos de qualquer momento." },
  ];

  return (
    <div>
      {/* Welcome banner */}
      {isAuthenticated && isClient && (
        <div className="bg-[#f0bf38]/10 border-b-2 border-[#f0bf38] px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-lg font-semibold text-[#09419b]">
              {t("home.welcome", "Olá")}, {user?.name}! {t("home.welcomeBack", "Bem-vindo de volta.")}
            </p>
          </div>
        </div>
      )}

      {/* HERO — Dark section (solid color, no gradient) */}
      <section className="hero-texture text-white py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Interactive camera mockup — upload + drag + zoom your photo */}
          <div>
            <CameraMockup isAdmin={isAdmin} lastEdit={mockupLastEdit} />
          </div>

          {/* Right: Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-4 leading-tight">
                Encontre as suas fotos
              </h1>
              <p className="text-xl text-white/80 leading-relaxed">
                Procure por nome do evento ou pelo seu rosto e leve as suas melhores fotos desportivas em alta qualidade.
              </p>
            </div>

            <div className="pt-4">
              <SearchEventBar />
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              {EVENT_CATEGORIES.slice(0, 4).map((c) => (
                <Link
                  key={c.value}
                  href={`/photos?sport=${encodeURIComponent(c.value)}`}
                  className="px-4 py-2 bg-[#f0bf38] text-[#09419b] rounded-full text-sm font-semibold hover:bg-[#f7d15f] transition"
                >
                  {t(c.labelKey)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES — Light section full-width banner */}
      <section className="bg-[#f5f1e8] py-12 px-6 border-y-4 border-[#f0bf38]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {EVENT_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/photos?sport=${encodeURIComponent(c.value)}`}
                className="px-4 py-2 bg-white text-[#09419b] rounded-lg text-xs font-semibold border border-[#f0bf38] hover:bg-[#f0bf38] hover:text-white transition"
              >
                {t(c.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT EVENTS — Light section with sidebar layout (podcast style) */}
      <section className="bg-[#f5f1e8] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar — Left */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-b from-[#ff2f92] to-[#f0bf38] text-white p-6 rounded-lg">
                <h3 className="text-2xl font-serif font-bold mb-8 text-center">Eventos Recentes</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="text-sm opacity-90">
                      <div className="font-semibold mb-1">Evento {i}</div>
                      <div className="text-xs opacity-75">Desporto • Data</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main content — Right */}
            <div className="lg:col-span-3">
              <RecentEvents />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — Dark section */}
      <section className="bg-[#1a1a1a] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center mb-12">Histórias de Sucesso</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "João Silva", role: "Fotógrafo", quote: "Comecei com a Laphotus e em 3 meses já vendi 500 fotos." },
              { name: "Maria Santos", role: "Organizadora", quote: "Meus clientes adoram encontrar fotos do evento na Laphotus." },
              { name: "Pedro Costa", role: "Fotógrafo", quote: "A melhor plataforma para monetizar minhas fotos de desportos." },
            ].map((t, i) => (
              <div key={i} className="border-l-4 border-[#f0bf38] pl-6 py-4">
                <div className="text-lg font-serif mb-3">"{t.quote}"</div>
                <div className="text-sm">
                  <div className="font-semibold text-[#f0bf38]">{t.name}</div>
                  <div className="text-white/60">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTOGRAPHERS — Light section with overlay style cards */}
      <section className="bg-[#f5f1e8] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center mb-12 text-[#09419b]">
            Fotógrafos Destacados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative group overflow-hidden rounded-lg">
                <div className="w-full h-80 bg-gradient-to-br from-[#09419b] to-[#f0bf38] flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-5xl mb-2">📸</div>
                    <div className="font-bold">Fotógrafo {i}</div>
                  </div>
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-[#f0bf38]/90 opacity-0 group-hover:opacity-100 transition flex items-end p-6 cursor-pointer">
                  <div className="text-[#1a1a1a]">
                    <div className="font-bold text-lg">Fotógrafo {i}</div>
                    <div className="text-sm opacity-80">Especializado em fotografia desportiva</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — Light section */}
      <section className="bg-[#f5f1e8] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center mb-12 text-[#09419b]">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-[#f0bf38]">
                <button
                  onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-[#f0bf38]/10 transition"
                >
                  <span className="font-semibold text-[#09419b] text-left">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-[#f0bf38] transition ${openFaq === item.id ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                {openFaq === item.id && (
                  <div className="px-6 pb-6 text-[#666] border-t border-[#f0bf38]/20">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Pink section */}
      <section className="bg-[#ff2f92] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-serif font-bold mb-6">
              Pronto para ganhar com as suas fotos?
            </h2>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Junte-se a milhares de fotógrafos que já estão a monetizar suas fotos de desportos com a Laphotus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-[#1a1a1a] text-white rounded-lg font-semibold hover:bg-[#333] transition inline-block text-center"
              >
                Começar Agora
              </Link>
              <Link
                href="/photos"
                className="px-8 py-4 bg-white/20 text-white border-2 border-white rounded-lg font-semibold hover:bg-white/30 transition inline-block text-center"
              >
                Explorar Fotos
              </Link>
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex justify-center">
            <div className="w-64 h-96 bg-[#09419b] rounded-3xl shadow-2xl flex items-center justify-center border-8 border-white/20">
              <div className="text-center">
                <div className="text-5xl mb-2">📱</div>
                <div className="text-white font-bold text-lg">Venda em Qualquer Lugar</div>
                <div className="text-xs text-white/60 mt-2">App Mobile</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS — Dark section */}
      <section className="bg-[#1a1a1a] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-[#f0bf38] mb-2">+5 mil</div>
              <div className="text-lg">Fotógrafos Ativos</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#f0bf38] mb-2">+12 mil</div>
              <div className="text-lg">Eventos Cobertos</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#f0bf38] mb-2">+8 M</div>
              <div className="text-lg">Fotos Entregues</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
