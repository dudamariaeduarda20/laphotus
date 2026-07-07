"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import EventForm from "@/components/EventForm";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/events/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Evento não encontrado");
        return r.json();
      })
      .then((d) => active && setEvent(d.event))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const handleSubmit = async (data: any) => {
    const res = await fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, date: new Date(data.date).toISOString() }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha ao atualizar evento");
    }
    router.push("/events");
  };

  const handleArchive = async () => {
    if (!confirm("Arquivar este evento? As fotos e encomendas são preservadas.")) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao arquivar");
      }
      router.push("/events");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao arquivar");
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
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

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Editar Evento</h1>
        <button
          onClick={handleArchive}
          disabled={archiving || event?.status === "archived"}
          className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium disabled:opacity-50"
        >
          {archiving ? "A arquivar…" : "Arquivar"}
        </button>
      </div>
      <p className="text-gray-600 mb-8">Atualizar detalhes do evento</p>

      {event && <EventForm onSubmit={handleSubmit} initialData={event} />}
    </div>
  );
}
