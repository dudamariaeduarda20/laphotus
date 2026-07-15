"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import RejectReasonModal from "@/components/RejectReasonModal";

interface EventRow {
  id: string;
  title: string;
  sport: string;
  date: string;
  status: string;
  organizer: { organizationName: string; user: { name: string; email: string } };
  _count: { photos: number };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: "Aprovado", color: "bg-[#e8f0ff] text-blue-800" },
  finished: { label: "Encerrado", color: "bg-gray-100 text-gray-700" },
  archived: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
};

export default function AdminEventsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchEvents = async (status: string) => {
    setLoading(true);
    try {
      const qs = status ? `?status=${status}` : "";
      const res = await fetch(`/api/admin/events${qs}`);
      if (!res.ok) throw new Error("Falha ao carregar eventos");
      const { events } = await res.json();
      setEvents(events);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchEvents(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, authLoading, router, statusFilter]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/events/${id}/approve`, { method: "PUT" });
      if (!res.ok) throw new Error("Falha ao aprovar");
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "active" } : e))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectingId) return;
    setBusyId(rejectingId);
    try {
      const res = await fetch(`/api/admin/events/${rejectingId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao rejeitar");
      }
      setEvents((prev) =>
        prev.map((e) => (e.id === rejectingId ? { ...e, status: "archived" } : e))
      );
      setRejectingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyId(null);
    }
  };

  const rejectingEvent = events.find((e) => e.id === rejectingId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moderação de Eventos</h1>
        <p className="text-gray-600 mt-2">Aprovar ou rejeitar eventos da plataforma</p>
      </div>

      <div className="flex gap-2">
        {[
          { value: "", label: "Todos" },
          { value: "active", label: "Aprovados" },
          { value: "archived", label: "Rejeitados" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              statusFilter === opt.value
                ? "bg-[#09419b] text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Evento</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Organizador</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Fotos</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const statusInfo = STATUS_LABEL[event.status] || STATUS_LABEL.active;
                  const isBusy = busyId === event.id;
                  return (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-600">{event.sport}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {event.organizer.organizationName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(event.date).toLocaleDateString("pt-PT")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-[#fef7e8] text-[#f0bf38] rounded-full text-sm font-semibold">
                          {event._count.photos}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                        {event.status !== "active" && (
                          <button
                            onClick={() => handleApprove(event.id)}
                            disabled={isBusy}
                            className="px-3 py-1 bg-[#09419b] text-white text-sm rounded hover:bg-[#09419b]/90 disabled:opacity-50"
                          >
                            ✓ Aprovar
                          </button>
                        )}
                        {event.status !== "archived" && (
                          <button
                            onClick={() => setRejectingId(event.id)}
                            disabled={isBusy}
                            className="px-3 py-1 bg-[#ff2f92] text-white text-sm rounded hover:bg-[#ff2f92]/90 disabled:opacity-50"
                          >
                            ✕ Rejeitar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {events.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhum evento encontrado</div>
          )}
        </div>
      )}

      {rejectingEvent && (
        <RejectReasonModal
          itemName={rejectingEvent.title}
          saving={busyId === rejectingEvent.id}
          onConfirm={handleReject}
          onClose={() => setRejectingId(null)}
        />
      )}
    </div>
  );
}
