"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import EventCard from "@/components/EventCard";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { useTranslation } from "@/lib/hooks/useTranslation";

function PhotosContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sport, setSport] = useState(searchParams.get("sport") || "");
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (sport) params.append("sport", sport);
        if (from) params.append("from", from);
        if (to) params.append("to", to);

        const res = await fetch(`/api/events?${params}`);
        if (!res.ok) throw new Error("Failed to fetch events");

        const { events } = await res.json();
        setEvents(events);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [search, sport, from, to]);

  return (
    <div>
      {/* Dark Hero Section */}
      <section className="bg-[#1a1a1a] text-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-serif font-bold text-5xl mb-4 leading-tight">
            {t("events.title", "Encontre seus eventos")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t("events.subtitle", "Busque fotos de todos os seus momentos desportivos favoritos")}
          </p>
        </div>
      </section>

      {/* Light Content Section with Sidebar Layout */}
      <section className="bg-[#f5f1e8] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar — Left (Filters) */}
            <div className="lg:col-span-1">
              {/* Sidebar Container */}
              <div className="sticky top-24 space-y-6">
                {/* Search Box */}
                <div className="bg-white rounded-lg p-6 shadow-soft border-l-4 border-[#f0bf38]">
                  <label className="block text-sm font-semibold text-[#09419b] mb-3 uppercase tracking-wide">
                    {t("dashboard.searchEvents", "Buscar")}
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("events.searchPlaceholder", "Nome do evento...")}
                    className="w-full px-4 py-3 border-2 border-[#f0bf38] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09419b] text-[#333]"
                  />
                </div>

                {/* Sport Filter */}
                <div className="bg-white rounded-lg p-6 shadow-soft border-l-4 border-[#ff2f92]">
                  <label className="block text-sm font-semibold text-[#09419b] mb-3 uppercase tracking-wide">
                    {t("events.category", "Desporto")}
                  </label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#ff2f92] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09419b] text-[#333] bg-white"
                  >
                    <option value="">{t("events.allCategories", "Todos")}</option>
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {t(c.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Info */}
                {(from || to) && (
                  <div className="bg-[#09419b] text-white p-4 rounded-lg text-sm">
                    <div className="font-semibold mb-2">Período:</div>
                    <div className="text-white/90">
                      {from || "—"} até {to || "—"}
                    </div>
                  </div>
                )}

                {/* Active Filters Indicator */}
                {(search || sport) && (
                  <div className="bg-[#f0bf38] text-[#1a1a1a] p-4 rounded-lg text-sm font-semibold text-center">
                    ✓ Filtros Ativos
                  </div>
                )}
              </div>
            </div>

            {/* Main Content — Right */}
            <div className="lg:col-span-3 space-y-8">
              {/* Error Message */}
              {error && (
                <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800 font-semibold">
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-[#f0bf38] border-t-[#09419b]"></div>
                  <p className="mt-4 text-[#666] font-medium">{t("common.loading", "Carregando...")}</p>
                </div>
              )}

              {/* Events Grid or Empty State */}
              {!loading && (
                <>
                  {events.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg p-12">
                      <div className="text-6xl mb-4">🎯</div>
                      <h2 className="text-3xl font-serif font-bold text-[#09419b] mb-3">
                        {t("events.empty.title", "Nenhum evento encontrado")}
                      </h2>
                      <p className="text-[#666] text-lg">
                        {t("events.empty.desc", "Tente ajustar seus filtros")}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Results Count */}
                      <div className="text-sm font-semibold text-[#09419b] mb-2">
                        {t("events.foundPrefix", "Encontrados")} <span className="text-[#f0bf38]">{events.length}</span>{" "}
                        {events.length !== 1 ? t("events.events", "eventos") : t("events.event", "evento")}
                      </div>

                      {/* Events Grid (3-column, responsive) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                          <div key={event.id} className="group">
                            <EventCard event={event} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dark CTA Section */}
      <section className="bg-[#1a1a1a] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-serif font-bold text-3xl mb-4">Não encontrou o que procurava?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Explore mais eventos ou configure alertas para ser notificado quando novos eventos forem adicionados
          </p>
          <a
            href="/"
            className="inline-block px-8 py-3 bg-[#ff2f92] text-white rounded-full font-semibold hover:opacity-90 transition"
          >
            Voltar à Home
          </a>
        </div>
      </section>
    </div>
  );
}

export default function PhotosPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Carregando...</div>}>
      <PhotosContent />
    </Suspense>
  );
}
