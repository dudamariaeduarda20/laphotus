"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface RevenueByDay {
  date: string;
  count: number;
  revenue: number;
}
interface PhotographerRanking {
  photographerId: string;
  name: string;
  photosSold: number;
  revenue: number;
}
interface OrganizerOrderRow {
  orderId: string;
  createdAt: string;
  status: string;
  buyerName: string;
  buyerEmail: string;
  itemCount: number;
  total: number;
}
interface OrganizerEventDetail {
  event: { id: string; title: string; sport: string; date: string; location: string | null };
  totals: { photoCount: number; photosSold: number; revenue: number; orderCount: number };
  revenueByDay: RevenueByDay[];
  photographerRanking: PhotographerRanking[];
  orders: OrganizerOrderRow[];
}

const eur = (n: number) =>
  `€ ${n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function RevenueChart({ data }: { data: RevenueByDay[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const W = 720;
  const H = 160;
  const gap = 2;
  const bw = (W - gap * (data.length - 1)) / data.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-40"
      preserveAspectRatio="none"
      role="img"
      aria-label="Faturamento por dia"
    >
      {data.map((d, i) => {
        const h = (d.revenue / max) * (H - 20);
        const x = i * (bw + gap);
        const y = H - h;
        return (
          <rect key={d.date} x={x} y={y} width={bw} height={h} rx={2} className="fill-emerald-500">
            <title>
              {d.date}: {eur(d.revenue)} ({d.count} venda{d.count !== 1 ? "s" : ""})
            </title>
          </rect>
        );
      })}
    </svg>
  );
}

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"];

export default function OrganizerEventDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isOrganizer, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [detail, setDetail] = useState<OrganizerEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<30 | 60 | 90>(30);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  const buildQuery = useCallback(() => {
    const qs = new URLSearchParams();
    qs.set("days", String(days));
    if (status) qs.set("status", status);
    if (from) qs.set("from", new Date(from).toISOString());
    if (to) qs.set("to", new Date(to).toISOString());
    return qs.toString();
  }, [days, status, from, to]);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/organizer/events/${id}?${buildQuery()}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Falha ao carregar painel");
      }
      setDetail(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [id, buildQuery]);

  useEffect(() => {
    if (authLoading) return;
    if (!isOrganizer) {
      router.push("/dashboard");
      return;
    }
    fetchDetail();
  }, [isOrganizer, authLoading, router, fetchDetail]);

  const handleCopyInvite = () => {
    const url = `${window.location.origin}/fotografo?evento=${id}`;
    navigator.clipboard.writeText(url);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleExportCsv = () => {
    window.open(`/api/organizer/events/${id}?${buildQuery()}&format=csv`, "_blank");
  };

  if (loading && !detail) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
    );
  }

  if (!detail) return null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/organizer/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
          ← {t("organizer.eventDashboard.back")}
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{detail.event.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {detail.event.sport} · {new Date(detail.event.date).toLocaleDateString("pt-PT")}
              {detail.event.location ? ` · ${detail.event.location}` : ""}
            </p>
          </div>
          <button
            onClick={handleCopyInvite}
            className="px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-sm font-semibold transition"
          >
            {inviteCopied ? `✓ ${t("organizer.eventDashboard.inviteCopied")}` : t("organizer.eventDashboard.copyInvite")}
          </button>
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("organizer.eventDashboard.photos")}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{detail.totals.photoCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("organizer.eventDashboard.photosSold")}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{detail.totals.photosSold}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("organizer.eventDashboard.revenue")}</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{eur(detail.totals.revenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("organizer.eventDashboard.orders")}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{detail.totals.orderCount}</p>
        </div>
      </div>

      {/* Gráfico faturamento */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 mb-8">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("organizer.eventDashboard.chartTitle")}
          </h3>
          <div className="flex gap-2">
            {([30, 60, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-sm rounded-lg font-semibold transition ${
                  days === d
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {detail.revenueByDay.some((d) => d.revenue > 0) ? (
          <RevenueChart data={detail.revenueByDay} />
        ) : (
          <div className="py-10 text-center text-gray-400 text-sm">
            {t("organizer.eventDashboard.chartEmpty")}
          </div>
        )}
      </div>

      {/* Ranking fotógrafos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t("organizer.eventDashboard.ranking")}
          </h2>
        </div>
        {detail.photographerRanking.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            {t("organizer.eventDashboard.rankingEmpty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("organizer.eventDashboard.photographer")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("organizer.eventDashboard.photosSold")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("organizer.eventDashboard.revenue")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {detail.photographerRanking.map((p, i) => (
                  <tr key={p.photographerId}>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}
                      {p.name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{p.photosSold}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-emerald-600">{eur(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pedidos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t("organizer.eventDashboard.orders")}
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg"
            >
              <option value="">{t("organizer.eventDashboard.filterAllStatus")}</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg"
            />
            <button
              onClick={fetchDetail}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              {t("organizer.eventDashboard.filterApply")}
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            >
              {t("organizer.eventDashboard.exportCsv")}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-800 text-sm">{error}</div>
        )}

        {detail.orders.length === 0 ? (
          <div className="p-12 text-center text-gray-600 dark:text-gray-400">
            {t("organizer.eventDashboard.ordersEmpty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("organizer.eventDashboard.orderDate")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("organizer.eventDashboard.buyer")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("organizer.eventDashboard.items")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("organizer.eventDashboard.revenue")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("organizer.eventDashboard.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {detail.orders.map((o) => (
                  <tr key={o.orderId}>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{o.buyerName}</div>
                      <div className="text-xs text-gray-500">{o.buyerEmail}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{o.itemCount}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {eur(o.total)}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded">
                        {o.status}
                      </span>
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
