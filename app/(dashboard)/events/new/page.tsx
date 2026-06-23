"use client";

import { useRouter } from "next/navigation";
import EventForm from "@/components/EventForm";
import { useAuth } from "@/lib/hooks/useAuth";

export default function NewEventPage() {
  const router = useRouter();
  const { isOrganizer } = useAuth();

  const handleSubmit = async (data: any) => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        date: new Date(data.date).toISOString(),
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create event");
    }

    const event = await res.json();
    router.push(`/events`);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Evento</h1>
      <p className="text-gray-600 mb-8">
        Configure um novo evento desportivo para fotógrafos carregarem fotos
      </p>

      <EventForm onSubmit={handleSubmit} />
    </div>
  );
}
