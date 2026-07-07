"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhotographerTabs from "@/components/PhotographerTabs";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface EventListItem {
  id: string;
  title: string;
  sport: string;
  date: string;
  location?: string | null;
}

export default function PhotographerOpportunitiesPage() {
  const { isPhotographer, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [ownEventIds, setOwnEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsRes, ownRes] = await Promise.all([
        fetch("/api/events?limit=100"),
        fetch("/api/photographer/events"),
      ]);
      if (!eventsRes.ok) throw new Error("Falha ao carregar eventos");
      const eventsData = await eventsRes.json();
      setEvents(eventsData.events || []);

      if (ownRes.ok) {
        const ownData = await ownRes.json();
        setOwnEventIds(new Set((ownData.events || []).map((e: { id: string }) => e.id)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isPhotographer) {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [isPhotographer, authLoading, router, fetchData]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <PhotographerTabs />

      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("photographer.opportunities.title")}
        </h1>
        <Link
          href="/events/new"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
        >
          + {t("photographer.opportunities.suggestEvent")}
        </Link>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        {t("photographer.opportunities.subtitle")}
      </p>
      <p className="text-xs text-gray-500 mb-8">
        {t("photographer.opportunities.suggestEvent.desc")}
      </p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center text-gray-600 dark:text-gray-400">
          {t("photographer.opportunities.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => {
            const hasPhotos = ownEventIds.has(ev.id);
            return (
              <div key={ev.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{ev.title}</h3>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded">
                    {ev.sport}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">
                  {new Date(ev.date).toLocaleDateString("pt-PT")}
                </p>
                {ev.location && (
                  <p className="text-sm text-gray-500 mb-3">📍 {ev.location}</p>
                )}
                {hasPhotos && (
                  <p className="text-xs text-green-600 font-semibold mb-3">
                    ✓ {t("photographer.opportunities.hasPhotos")}
                  </p>
                )}
                <Link
                  href={`/upload?eventId=${ev.id}`}
                  className="mt-auto text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition"
                >
                  {t("photographer.opportunities.uploadCta")}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
