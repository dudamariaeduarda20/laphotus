"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PhotoUpload from "@/components/PhotoUpload";
import { useAuth } from "@/lib/hooks/useAuth";

export default function UploadPage() {
  const { isPhotographer, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(eventId || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aguarda o auth carregar antes de decidir redirecionar
    if (authLoading) return;

    if (!isPhotographer) {
      router.push("/dashboard");
      return;
    }

    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");

        const { events } = await res.json();
        setEvents(events);

        if (!selectedEventId && events.length > 0) {
          setSelectedEventId(events[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isPhotographer, authLoading, router, selectedEventId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Carregar Fotos</h1>
      <p className="text-gray-600 mb-8">
        Carregue fotos para eventos e defina preços
      </p>

      {/* Event Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione Evento
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Escolha um evento...</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} ({event.sport}) -{" "}
              {new Date(event.date).toLocaleDateString("pt-PT")}
            </option>
          ))}
        </select>

        {events.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <p className="font-semibold mb-2">Nenhum evento disponível</p>
            <p className="text-sm">
              Contacte o organizador do evento para adicionar fotos aos seus eventos.
            </p>
          </div>
        )}
      </div>

      {/* Upload Component */}
      {selectedEventId && (
        <PhotoUpload
          eventId={selectedEventId}
          onUploadSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
