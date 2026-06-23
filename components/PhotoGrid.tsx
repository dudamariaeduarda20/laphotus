"use client";

import PhotoCard from "./PhotoCard";
import { useState } from "react";

interface PhotoGridProps {
  photos: any[];
  eventId: string;
  event?: any;
  isLoading?: boolean;
}

export default function PhotoGrid({
  photos,
  eventId,
  event,
  isLoading = false,
}: PhotoGridProps) {
  const [sortBy, setSortBy] = useState("newest");
  const [filterPremium, setFilterPremium] = useState(false);

  // Filter
  let filtered = [...photos];
  if (filterPremium) {
    filtered = filtered.filter((p) => p.isPremium);
  }

  // Sort
  if (sortBy === "newest") {
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (sortBy === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">A carregar fotos...</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma foto ainda
        </h3>
        <p className="text-gray-600">
          Fotos deste evento aparecerão aqui quando fotógrafos as carregarem.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="newest">Mais Recentes Primeiro</option>
              <option value="price-low">Preço: Baixo para Alto</option>
              <option value="price-high">Preço: Alto para Baixo</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterPremium}
                onChange={(e) => setFilterPremium(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Apenas Premium
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} eventId={eventId} event={event} />
        ))}
      </div>

      {/* Results Count */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Exibindo {filtered.length} de {photos.length} fotos
      </div>
    </div>
  );
}
