"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhotographerTabs from "@/components/PhotographerTabs";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface EventSummary {
  id: string;
  title: string;
  sport: string;
  date: string;
  photoCount: number;
  soldCount: number;
  revenue: number;
}

interface SoldPhotoEntry {
  photoId: string;
  photoName: string;
  eventId: string;
  eventTitle: string;
  price: number;
  orderId: string;
  createdAt: string;
}

const eur = (n: number) =>
  `€ ${n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PhotographerEventsPage() {
  const { isPhotographer, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [recentSales, setRecentSales] = useState<SoldPhotoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/photographer/events");
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await res.json();
      setEvents(data.events || []);
      setRecentSales(data.recentSales || []);
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
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
      </div>
    );
  }

  return (
    <div>
      <PhotographerTabs />

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {t("photographer.events.title")}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t("photographer.events.subtitle")}
      </p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("photographer.events.empty")}
          </p>
          <Link
            href="/upload"
            className="inline-block px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b]"
          >
            {t("photographer.tabs.upload")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 dark:text-white">{ev.title}</h3>
                <span className="px-2 py-1 bg-[#e8f0ff] dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded">
                  {ev.sport}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {new Date(ev.date).toLocaleDateString("pt-PT")}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{ev.photoCount}</p>
                  <p className="text-xs text-gray-500">{t("photographer.events.photoCount")}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{ev.soldCount}</p>
                  <p className="text-xs text-gray-500">{t("photographer.events.soldCount")}</p>
                </div>
                <div>
                  <p className="font-bold text-[#f0bf38]">{eur(ev.revenue)}</p>
                  <p className="text-xs text-gray-500">{t("photographer.events.revenue")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t("photographer.events.recentSales.title")}
          </h2>
        </div>
        {recentSales.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {t("photographer.events.recentSales.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentSales.map((s) => (
                  <tr key={`${s.orderId}-${s.photoId}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {s.photoName}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{s.eventTitle}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-[#f0bf38] text-right">
                      {eur(s.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
