"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EventsPage() {
  const { user, isOrganizer } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [isOrganizer, router]);

  const handleDelete = async (eventId: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete event");

      setEvents(events.filter((e) => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
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
                    <div className="flex gap-2">
                      <Link
                        href={`/events/${event.id}/edit`}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-700 font-semibold"
                      >
                        Eliminar
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
