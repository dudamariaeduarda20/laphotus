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

  // Estado inicial vem dos query params da URL (vindos da home / modal)
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">{t("events.title")}</h1>
          <p className="text-[#e8f0ff]">
            {t("events.subtitle")}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("dashboard.searchEvents")}
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("events.searchPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("events.category")}
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("events.allCategories")}</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {t(c.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(from || to) && (
            <div className="mt-3 text-sm text-gray-500">
              {t("events.filterDate")} {from || "…"} → {to || "…"}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
          </div>
        )}

        {/* Events Grid */}
        {!loading && (
          <>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("events.empty.title")}
                </h2>
                <p className="text-gray-600">
                  {t("events.empty.desc")}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {t("events.foundPrefix")} {events.length}{" "}
                  {events.length !== 1 ? t("events.events") : t("events.event")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return <div className="py-20 text-center text-gray-400">{t("common.loading")}</div>;
}

export default function PhotosPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PhotosContent />
    </Suspense>
  );
}
