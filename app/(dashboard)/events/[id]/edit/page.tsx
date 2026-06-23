"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EventForm from "@/components/EventForm";

export default function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${params.id}`);
        if (!res.ok) throw new Error("Event not found");

        const { event } = await res.json();
        setEvent(event);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    const res = await fetch(`/api/events/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        date: new Date(data.date).toISOString(),
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update event");
    }

    router.push(`/events`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Evento</h1>
      <p className="text-gray-600 mb-8">Atualizar detalhes do evento</p>

      {event && <EventForm onSubmit={handleSubmit} initialData={event} />}
    </div>
  );
}
