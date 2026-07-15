"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import LocationFilter from "@/components/LocationFilter";
import DateFilter from "@/components/DateFilter";
import { Calendar, MapPin, Users } from "lucide-react";

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  date: string;
  sport: string;
  banner: string | null;
  photos: Array<{ id: string }>;
};

export default function EventsPage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [sport, setSport] = useState(searchParams.get("sport") || "");
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, [location, sport, dateFrom, dateTo]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (location) params.append("location", location);
      if (sport) params.append("sport", sport);
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);
      params.append("limit", "20");

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data.events || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Fetch events error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (from?: string, to?: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-[#09419b] mb-6">
            Eventos Desportivos
          </h1>

          {/* Filters */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocationFilter value={location} onChange={setLocation} />

              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#09419b] outline-none"
              >
                <option value="">Todos os desportos</option>
                <option value="Futebol">Futebol</option>
                <option value="Vôlei">Vôlei</option>
                <option value="Basquete">Basquete</option>
                <option value="Ténis">Ténis</option>
                <option value="Atletismo">Atletismo</option>
              </select>
            </div>

            <DateFilter onDateChange={handleDateChange} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">
              {location || sport
                ? "Sem eventos com esses critérios"
                : "Nenhum evento disponível"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-6">
              {total} evento{total !== 1 ? "s" : ""} encontrado
              {location ? ` em ${location}` : ""}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/photos/${event.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Banner */}
                    <div className="relative w-full aspect-video bg-gray-200">
                      {event.banner && (
                        <img
                          src={event.banner}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-[#09419b] mb-2 line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-600">
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-[#f0bf38]" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-[#ff2f92]" />
                          <span>
                            {new Date(event.date).toLocaleDateString("pt-PT")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-[#09419b]" />
                          <span>{event.photos.length} fotos</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t text-sm font-semibold text-[#09419b]">
                        Ver fotos →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
