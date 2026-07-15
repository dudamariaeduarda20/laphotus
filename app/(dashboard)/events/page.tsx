"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEFAULT_EVENT_COVER = "/images/default-event-cover.jpg";

interface EventRow {
  id: string;
  title: string;
  sport: string;
  date: string;
  location: string | null;
  status: string;
  banner: string | null;
  mockupImageUrl: string | null;
  _count?: { photos: number };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente (a aguardar aprovação)", color: "bg-[#fef7e8] text-[#a37a00]" },
  active: { label: "Ativo", color: "bg-[#e8f0ff] text-blue-800" },
  finished: { label: "Encerrado", color: "bg-gray-100 text-gray-700" },
  archived: { label: "Arquivado", color: "bg-red-50 text-red-700" },
};

export default function EventsPage() {
  const { isOrganizer, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isOrganizer && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/organizer/events");
        if (!res.ok) throw new Error("Falha ao carregar eventos");

        const { events } = await res.json();
        setEvents(events);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar eventos");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isOrganizer, authLoading, router]);

  const handleToggleStatus = async (event: EventRow) => {
    const nextStatus = event.status === "active" ? "archived" : "active";
    setBusyId(event.id);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao atualizar estado");
      }
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, status: nextStatus } : e))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar estado");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (event: EventRow) => {
    const photoCount = event._count?.photos ?? 0;
    const confirmMsg =
      photoCount > 0
        ? `Este evento tem ${photoCount} foto${photoCount === 1 ? "" : "s"}. Não pode ser apagado — vai ser arquivado (some da loja, mas fotos e encomendas continuam intactas). Continuar?`
        : "Apagar este evento definitivamente? Esta ação não pode ser desfeita.";
    if (!confirm(confirmMsg)) return;

    setBusyId(event.id);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao apagar");
      }
      const result = await res.json();
      if (result.archived) {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: "archived" } : e))
        );
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao apagar");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600 mt-1">Gerencie seus eventos desportivos</p>
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const cover = event.banner || event.mockupImageUrl || DEFAULT_EVENT_COVER;
            const statusInfo = STATUS_LABEL[event.status] || STATUS_LABEL.active;
            const isBusy = busyId === event.id;
            const photoCount = event._count?.photos ?? 0;

            return (
              <div
                key={event.id}
                className={`bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition ${
                  event.status === "archived" ? "opacity-60" : ""
                }`}
              >
                <div className="relative h-40 bg-gray-200">
                  <img
                    src={cover}
                    alt={event.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_EVENT_COVER;
                    }}
                  />
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString("pt-PT")}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <span className="rounded bg-[#e8f0ff] px-2 py-1 font-semibold text-blue-800">
                      {event.sport}
                    </span>
                    <span className="rounded bg-[#fef7e8] px-2 py-1 font-semibold text-[#f0bf38]">
                      {photoCount} foto{photoCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="rounded-lg bg-[#09419b] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#09419b]/90"
                    >
                      ✎ Editar
                    </Link>
                    <Link
                      href={`/photos/${event.id}`}
                      className="rounded-lg bg-gray-100 px-3 py-2 text-center text-xs font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      🖼 Ver Fotos
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(event)}
                      disabled={isBusy}
                      className="rounded-lg bg-[#fef7e8] px-3 py-2 text-xs font-semibold text-[#f0bf38] hover:bg-[#fef7e8]/70 disabled:opacity-50"
                    >
                      {event.status === "active" ? "🚫 Desativar" : "👁 Ativar"}
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      disabled={isBusy}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      🗑 Apagar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
