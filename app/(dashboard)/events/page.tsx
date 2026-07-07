"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EventsPage() {
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isOrganizer) {
      router.push("/dashboard");
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");

        const { events } = await res.json();
        setEvents(events);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isOrganizer, authLoading, router]);

  const handleDelete = async (eventId: string) => {
    if (!confirm("Arquivar este evento? As fotos e encomendas são preservadas.")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Falha ao arquivar");
      }
      // Atualiza estado local: muda status para archived (não remove da lista)
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "archived" } : e))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao arquivar");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600 mt-1">Gerencie seus eventos desportivos</p>
        </div>
        <Link
          href="/events/new"
          className="px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] transition"
        >
          + Criar Evento
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum evento ainda
          </h2>
          <p className="text-gray-600 mb-6">
            Crie seu primeiro evento para começar a carregar fotos
          </p>
          <Link
            href="/events/new"
            className="inline-block px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b]"
          >
            Criar Evento
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                  Nome do Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                  Desporto
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                  Fotos
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      {event.title}
                    </div>
                    {event.location && (
                      <div className="text-sm text-gray-600">
                        {event.location}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-[#e8f0ff] text-blue-800 text-xs font-semibold rounded">
                      {event.sport}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {event.photos?.length || 0} fotos
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/events/${event.id}/edit`}
                        className="text-[#09419b] hover:text-[#09419b] font-semibold text-sm"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/events/${event.id}/bibs`}
                        className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
                      >
                        Dorsais
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        Arquivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
