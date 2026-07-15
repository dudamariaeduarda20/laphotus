"use client";

import PhotoCard from "./PhotoCard";
import { useTranslation } from "@/lib/hooks/useTranslation";
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
  const { t } = useTranslation();
  // Modo busca facial: fotos vêm com matchPercent e já ordenadas por
  // similaridade. Default = "match" para não perder essa ordem.
  const isFaceMatch = photos.some((p) => typeof p.matchPercent === "number");
  const [sortBy, setSortBy] = useState(isFaceMatch ? "match" : "newest");
  const [filterPremium, setFilterPremium] = useState(false);

  // Filter
  let filtered = [...photos];
  if (filterPremium) {
    filtered = filtered.filter((p) => p.isPremium);
  }

  // Sort
  if (sortBy === "match") {
    filtered.sort((a, b) => (b.matchPercent ?? 0) - (a.matchPercent ?? 0));
  } else if (sortBy === "newest") {
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
        <div className="text-gray-500">{t("grid.loading")}</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("grid.empty.title")}
        </h3>
        <p className="text-gray-600">
          {t("grid.empty.desc")}
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
              {t("grid.sortBy")}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {isFaceMatch && <option value="match">% match</option>}
              <option value="newest">{t("grid.sort.newest")}</option>
              <option value="price-low">{t("grid.sort.priceLow")}</option>
              <option value="price-high">{t("grid.sort.priceHigh")}</option>
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
                {t("grid.premiumOnly")}
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
        {t("grid.showing")} {filtered.length} {t("grid.of")} {photos.length} {t("grid.photos")}
      </div>
    </div>
  );
}
