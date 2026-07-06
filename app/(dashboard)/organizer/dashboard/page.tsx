"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EventData {
  id: string;
  title: string;
  sport: string;
  date: string;
  photoCount: number;
  photosSold: number;
  revenue: number;
}

interface OrganizerStats {
  eventCount: number;
  totalPhotosSold: number;
  totalRevenue: number;
  conversionRate: number;
}

export default function OrganizerDashboard() {
  const { isOrganizer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizerData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/organizer/stats");
      if (!res.ok) throw new Error("Falha ao carregar dados");

      const data = await res.json();
      setEvents(data.events || []);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isOrganizer) {
      router.push("/dashboard");
      return;
    }

    fetchOrganizerData();
  }, [isOrganizer, authLoading, router, fetchOrganizerData]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel Organizador</h1>
        <p className="text-gray-600 mt-2">
          Relatórios e métricas de desempenho dos seus eventos
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Estatísticas Globais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Total de Eventos
          </div>
          <div className="text-4xl font-bold text-blue-600 mt-2">
            {stats?.eventCount || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Fotos Vendidas
          </div>
          <div className="text-4xl font-bold text-green-600 mt-2">
            {stats?.totalPhotosSold || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Faturamento Total
          </div>
          <div className="text-4xl font-bold text-emerald-600 mt-2">
            € {(stats?.totalRevenue || 0).toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Taxa de Conversão
          </div>
          <div className="text-4xl font-bold text-purple-600 mt-2">
            {stats?.conversionRate?.toFixed(1) || 0}%
          </div>
        </div>
      </div>

      {/* Tabela de Eventos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Desempenho dos Eventos</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Fotos
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Vendidas
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Faturamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-600">{event.sport}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {event.photoCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      {event.photosSold || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    € {(event.revenue || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/organizer/events/${event.id}`}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                    >
                      Ver Detalhes →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <div className="p-12 text-center text-gray-600">
            Nenhum evento criado ainda.{" "}
            <Link href="/events/new" className="text-blue-600 hover:text-blue-700">
              Criar agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
