"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EventStat {
  id: string;
  title: string;
  sport: string;
  date: string;
  photoCount: number;
  photosSold: number;
  revenue: number;
}

interface GlobalStats {
  eventCount: number;
  totalPhotosSold: number;
  totalRevenue: number;
  conversionRate: number;
}

function RevenueChart({ events }: { events: EventStat[] }) {
  const topEvents = [...events]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  if (topEvents.length === 0) return null;

  const maxRevenue = Math.max(...topEvents.map((e) => e.revenue), 1);
  const chartH = 160;
  const barW = 40;
  const gap = 16;
  const labelH = 40;
  const totalW = topEvents.length * (barW + gap) + gap;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="font-semibold text-gray-900 mb-4">
        Faturamento por Evento (Top {topEvents.length})
      </h2>
      <div className="overflow-x-auto">
        <svg
          width={totalW}
          height={chartH + labelH}
          viewBox={`0 0 ${totalW} ${chartH + labelH}`}
          className="min-w-full"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = chartH - pct * chartH;
            return (
              <g key={pct}>
                <line
                  x1={0}
                  y1={y}
                  x2={totalW}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
                <text
                  x={2}
                  y={y - 3}
                  fontSize={9}
                  fill="#9ca3af"
                >
                  €{((pct * maxRevenue)).toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {topEvents.map((ev, i) => {
            const x = gap + i * (barW + gap);
            const barH = Math.max(2, (ev.revenue / maxRevenue) * (chartH - 8));
            const y = chartH - barH;
            const shortTitle =
              ev.title.length > 8 ? ev.title.slice(0, 8) + "…" : ev.title;

            return (
              <g key={ev.id}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill="#3b82f6"
                  opacity={0.85}
                />
                {ev.revenue > 0 && (
                  <text
                    x={x + barW / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#374151"
                    fontWeight="600"
                  >
                    €{ev.revenue.toFixed(0)}
                  </text>
                )}
                <text
                  x={x + barW / 2}
                  y={chartH + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#6b7280"
                >
                  {shortTitle}
                </text>
                <text
                  x={x + barW / 2}
                  y={chartH + 26}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#9ca3af"
                >
                  {ev.sport}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { isOrganizer, loading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventStat[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isOrganizer) {
      router.push("/dashboard");
      return;
    }
    let active = true;
    fetch("/api/organizer/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error("Falha ao carregar analytics");
        return r.json();
      })
      .then((d) => {
        if (!active) return;
        setEvents(d.events || []);
        setStats(d.stats || null);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [authLoading, isOrganizer, router]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#09419b]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        {error}
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Eventos",
      value: stats?.eventCount ?? 0,
      icon: "📅",
      fmt: (v: number) => v.toString(),
    },
    {
      label: "Fotos Vendidas",
      value: stats?.totalPhotosSold ?? 0,
      icon: "📸",
      fmt: (v: number) => v.toString(),
    },
    {
      label: "Faturamento Total",
      value: stats?.totalRevenue ?? 0,
      icon: "💶",
      fmt: (v: number) => `€${v.toFixed(2)}`,
    },
    {
      label: "Taxa de Conversão",
      value: stats?.conversionRate ?? 0,
      icon: "📊",
      fmt: (v: number) => `${v.toFixed(1)}%`,
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Desempenho dos seus eventos desportivos
          </p>
        </div>
        <Link
          href="/events"
          className="text-sm text-[#09419b] hover:underline"
        >
          ← Eventos
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow p-5">
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-2xl font-bold text-gray-900">
              {c.fmt(c.value)}
            </div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {events.length > 0 && <div className="mb-8"><RevenueChart events={events} /></div>}

      {/* Per-event table */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Detalhe por Evento</h2>
        </div>
        {events.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            Nenhum evento ainda.{" "}
            <Link href="/events/new" className="text-[#09419b] hover:underline">
              Crie um evento
            </Link>{" "}
            para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-900">
                    Evento
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-900">
                    Data
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-900">
                    Fotos
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-900">
                    Vendidas
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-900">
                    Conversão
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-900">
                    Faturamento
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...events]
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((ev) => {
                    const conv =
                      ev.photoCount > 0
                        ? ((ev.photosSold / ev.photoCount) * 100).toFixed(1)
                        : "—";
                    return (
                      <tr key={ev.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">
                            {ev.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-[#e8f0ff] text-[#09419b] rounded text-xs font-medium">
                              {ev.sport}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {new Date(ev.date).toLocaleDateString("pt-PT")}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-700">
                          {ev.photoCount}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-700">
                          {ev.photosSold}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={
                              ev.photosSold > 0
                                ? "text-[#f0bf38] font-semibold"
                                : "text-gray-400"
                            }
                          >
                            {conv}
                            {ev.photoCount > 0 ? "%" : ""}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">
                          €{ev.revenue.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              {events.length > 1 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-5 py-3 font-semibold text-gray-900"
                    >
                      Total
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {events.reduce((s, e) => s + e.photoCount, 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {events.reduce((s, e) => s + e.photosSold, 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-700">
                      {stats ? `${stats.conversionRate.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-[#09419b]">
                      €{events.reduce((s, e) => s + e.revenue, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
