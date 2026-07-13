"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

interface FilterBarProps {
  events: Set<string>;
  statuses: string[];
}

export default function FilterBar({ events, statuses }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Load filters from URL on mount
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setEventFilter(searchParams.get("event") || "");
    setStatusFilter(searchParams.get("status") || "");
    setDateFrom(searchParams.get("dateFrom") || "");
    setDateTo(searchParams.get("dateTo") || "");
  }, [searchParams]);

  // Update URL params when filters change
  const updateFilters = (
    newSearch?: string,
    newEvent?: string,
    newStatus?: string,
    newDateFrom?: string,
    newDateTo?: string
  ) => {
    const params = new URLSearchParams();

    const s = newSearch !== undefined ? newSearch : search;
    const e = newEvent !== undefined ? newEvent : eventFilter;
    const st = newStatus !== undefined ? newStatus : statusFilter;
    const df = newDateFrom !== undefined ? newDateFrom : dateFrom;
    const dt = newDateTo !== undefined ? newDateTo : dateTo;

    if (s) params.set("search", s);
    if (e) params.set("event", e);
    if (st) params.set("status", st);
    if (df) params.set("dateFrom", df);
    if (dt) params.set("dateTo", dt);

    router.push(`?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateFilters(value);
  };

  const handleEventChange = (value: string) => {
    setEventFilter(value);
    updateFilters(undefined, value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateFilters(undefined, undefined, value);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    updateFilters(undefined, undefined, undefined, value);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    updateFilters(undefined, undefined, undefined, undefined, value);
  };

  const hasActiveFilters =
    search || eventFilter || statusFilter || dateFrom || dateTo;

  const handleReset = () => {
    setSearch("");
    setEventFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    router.push("");
  };

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Buscar por Evento
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Digite o nome do evento..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Event Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">
              Evento
            </label>
            <select
              value={eventFilter}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos os eventos</option>
              {Array.from(events).sort().map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos os status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "PENDING"
                    ? "Pendente"
                    : status === "COMPLETED"
                      ? "Pago"
                      : status === "PROCESSING"
                        ? "Processando"
                        : status === "FAILED"
                          ? "Falhou"
                          : "Reembolsado"}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">
              Data De
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">
              Data Até
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
