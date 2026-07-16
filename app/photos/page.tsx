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
      {/* Hero Section — Dark Editorial */}
      <section className="bg-[#1a1a1a] text-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif font-bold text-6xl mb-6 leading-tight">
            {t("events.title", "Encontre seus eventos")}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl leading-relaxed">
            {t("events.subtitle", "Busque fotos de todos os seus momentos desportivos favoritos")}
          </p>
        </div>
      </section>

      {/* Content — Light section with sidebar + grid */}
      <section className="bg-[#f5f1e8] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar — Left (Filters + Info) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Sidebar Header Card — Gradient (Podcast Style) */}
                <div className="bg-gradient-to-b from-[#ff2f92] to-[#f0bf38] text-white p-8 rounded-lg">
                  <h3 className="text-2xl font-serif font-bold mb-6 text-center">{t("events.filtersTitle", "Filtros")}</h3>
                  <div className="space-y-4 text-sm opacity-95">
                    <div className="font-semibold">{t("events.filtersSubtitle", "Refine sua busca")}</div>
                    <p className="text-white/80">{t("events.filtersDesc", "Use os filtros abaixo para encontrar eventos e fotos específicas")}</p>
                  </div>
                </div>

                {/* Search Input */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#09419b] uppercase tracking-wider">
                    {t("dashboard.searchEvents", "Buscar evento")}
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("events.searchPlaceholder", "Nome do evento...")}
                    className="w-full px-5 py-3 border-2 border-[#f0bf38] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09419b] text-[#333] bg-white"
                  />
                </div>

                {/* Sport Filter */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#09419b] uppercase tracking-wider">
                    {t("events.category", "Desporto")}
                  </label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full px-5 py-3 border-2 border-[#ff2f92] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09419b] text-[#333] bg-white font-medium"
                  >
                    <option value="">{t("events.allCategories", "Todos os desportos")}</option>
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {t(c.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Display */}
                {(from || to) && (
                  <div className="bg-[#09419b] text-white p-5 rounded-lg space-y-2">
                    <div className="font-semibold text-xs uppercase tracking-wide">Período</div>
                    <div className="text-sm text-white/90">
                      {from || "—"} até {to || "—"}
                    </div>
                  </div>
                )}

                {/* Active Filters Badge */}
                {(search || sport) && (
                  <div className="bg-[#f0bf38] text-[#1a1a1a] p-4 rounded-lg text-center font-semibold text-sm">
                    ✓ {search && sport ? "2" : "1"} filtro ativo
                  </div>
                )}
              </div>
            </div>

            {/* Main Content — Grid */}
            <div className="lg:col-span-3 space-y-8">
              {/* Error State */}
              {error && (
                <div className="p-6 bg-red-50/80 border-l-4 border-red-500 rounded-lg">
                  <div className="text-red-800 font-semibold">{error}</div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-24">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#f0bf38] border-t-[#09419b] mb-4"></div>
                  <p className="text-[#09419b] font-medium">{t("common.loading", "Carregando...")}</p>
                </div>
              )}

              {/* Events Grid or Empty */}
              {!loading && (
                <>
                  {events.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-lg px-8">
                      <div className="text-7xl mb-6">🎯</div>
                      <h2 className="text-4xl font-serif font-bold text-[#09419b] mb-3">
                        {t("events.empty.title", "Nenhum evento encontrado")}
                      </h2>
                      <p className="text-[#666] text-lg mb-8">
                        {t("events.empty.desc", "Tente ajustar seus filtros ou explorar outras categorias")}
                      </p>
                      <a
                        href="/photos"
                        className="inline-block px-8 py-3 bg-[#09419b] text-white font-semibold rounded-lg hover:bg-[#0a2e6b] transition"
                      >
                        {t("events.clearFilters", "Limpar filtros")}
                      </a>
                    </div>
                  ) : (
                    <>
                      {/* Results Header */}
                      <div className="flex items-center justify-between border-b-2 border-[#f0bf38] pb-4">
                        <h2 className="text-2xl font-serif font-bold text-[#09419b]">
                          {t("events.foundPrefix", "Encontrados")}
                        </h2>
                        <div className="text-3xl font-bold text-[#f0bf38]">{events.length}</div>
                      </div>

                      {/* Events Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                          <div key={event.id}>
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

      {/* CTA Section — Dark with Bold Copy */}
      <section className="bg-[#1a1a1a] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif font-bold text-5xl mb-6 leading-tight">
            {t("events.ctaTitle", "Não encontrou o que procurava?")}
          </h2>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            {t("events.ctaDesc", "Explore mais eventos, configure alertas, ou navegue por categoria para descobrir novas fotos")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-8 py-4 bg-[#09419b] text-white font-semibold rounded-lg hover:bg-[#0a2e6b] transition"
            >
              {t("notFound.home", "Voltar ao início")}
            </a>
            <a
              href="/photos"
              className="px-8 py-4 border-2 border-[#f0bf38] text-[#f0bf38] font-semibold rounded-lg hover:bg-[#f0bf38]/10 transition"
            >
              {t("home.recent.viewall", "Ver todos os eventos")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PhotosPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="text-center py-20">{t("common.loading", "Carregando...")}</div>}>
      <PhotosContent />
    </Suspense>
  );
}
