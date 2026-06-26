"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EventCard from "./EventCard";
import { EVENT_CATEGORIES } from "@/lib/categories";

/**
 * Seção "Eventos recentes" da home: filtro por categoria + grid de cards,
 * com fetch real de /api/events.
 */
export default function RecentEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ limit: "8" });
    if (sport) params.append("sport", sport);
    fetch(`/api/events?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setEvents(d.events || []);
      })
      .catch(() => active && setEvents([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [sport]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Eventos recentes</h2>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Todas as categorias</option>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-3">📭</div>
          <p>Nenhum evento nesta categoria por agora.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <Link
          href="/photos"
          className="inline-block px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
        >
          Ver todos os eventos
        </Link>
      </div>
    </section>
  );
}
