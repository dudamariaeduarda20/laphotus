"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import type { PlatformAnalytics } from "@/lib/services/adminAnalyticsService";
import SalesBarChart from "./SalesBarChart";
import CumulativeLineChart from "./CumulativeLineChart";
import WeeklySignupsChart from "./WeeklySignupsChart";
import PhotosBySportChart from "./PhotosBySportChart";
import ExportReportButton from "./ExportReportButton";

export default function AdminAnalyticsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error("Falha ao carregar estatísticas");
        setData(await res.json());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAdmin, authLoading, router]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        {error || "Falha ao carregar"}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estatísticas da Plataforma</h1>
          <p className="text-gray-600 mt-2">Visão consolidada de vendas, utilizadores e conteúdo</p>
        </div>
        <ExportReportButton data={data} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">Total de Vendas</div>
          <div className="text-3xl font-bold text-[#09419b] mt-2">{data.totalSales}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">Receita Bruta</div>
          <div className="text-3xl font-bold text-[#f0bf38] mt-2">
            € {data.grossRevenue.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">Comissão Plataforma</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2">
            € {data.platformCommission.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">Utilizadores Ativos (30d)</div>
          <div className="text-3xl font-bold text-[#ff2f92] mt-2">{data.activeUsers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">Fotos Publicadas</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{data.totalPhotos}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Vendas — Últimos 30 dias</h2>
          <SalesBarChart data={data.salesByDay} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Receita Acumulada — Últimos 30 dias</h2>
          <CumulativeLineChart data={data.cumulative} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Novos Utilizadores por Semana</h2>
          <WeeklySignupsChart data={data.weeklySignups} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Fotos por Categoria/Esporte</h2>
          {data.photosBySport.length > 0 ? (
            <PhotosBySportChart data={data.photosBySport} />
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">Sem fotos publicadas ainda</p>
          )}
        </div>
      </div>

      {/* Top Photographers */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Fotógrafos com Mais Vendas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Fotógrafo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Vendas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Receita</th>
              </tr>
            </thead>
            <tbody>
              {data.topPhotographers.map((p) => (
                <tr key={p.photographerId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-[#e8f0ff] text-blue-800 rounded-full text-sm font-semibold">
                      {p.salesCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">€ {p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.topPhotographers.length === 0 && (
          <div className="p-12 text-center text-gray-600">Sem vendas registadas</div>
        )}
      </div>

      {/* Top Events */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Eventos com Mais Ganho</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Evento</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Fotos Vendidas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Receita</th>
              </tr>
            </thead>
            <tbody>
              {data.topEvents.map((e) => (
                <tr key={e.eventId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{e.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-[#fef7e8] text-[#f0bf38] rounded-full text-sm font-semibold">
                      {e.photosSold}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">€ {e.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.topEvents.length === 0 && (
          <div className="p-12 text-center text-gray-600">Sem vendas registadas</div>
        )}
      </div>
    </div>
  );
}
