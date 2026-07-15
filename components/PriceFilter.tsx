"use client";

import { useState } from "react";
import { Euro, ArrowUpDown } from "lucide-react";

type PriceRange = "under-5" | "5-10" | "10-20" | "over-20";
type SortBy = "newest" | "price-asc" | "price-desc";

type PriceFilterProps = {
  onPriceChange: (minPrice?: number, maxPrice?: number) => void;
  onSortChange: (sortBy: SortBy) => void;
};

const priceRanges: { id: PriceRange; label: string; min?: number; max?: number }[] = [
  { id: "under-5", label: "Menos de €5", max: 5 },
  { id: "5-10", label: "€5 - €10", min: 5, max: 10 },
  { id: "10-20", label: "€10 - €20", min: 10, max: 20 },
  { id: "over-20", label: "€20+", min: 20 },
];

export default function PriceFilter({ onPriceChange, onSortChange }: PriceFilterProps) {
  const [selectedRange, setSelectedRange] = useState<PriceRange | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const handleRangeChange = (range: PriceRange) => {
    if (selectedRange === range) {
      setSelectedRange(null);
      onPriceChange();
    } else {
      setSelectedRange(range);
      const found = priceRanges.find((r) => r.id === range);
      if (found) {
        onPriceChange(found.min, found.max);
      }
    }
  };

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    onSortChange(newSort);
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg border border-gray-200">
      {/* Price Ranges */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Euro size={16} className="text-[#f0bf38]" />
          Faixa de Preço
        </h3>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label key={range.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRange === range.id}
                onChange={() => handleRangeChange(range.id)}
                className="w-4 h-4 rounded border-gray-300 text-[#09419b] focus:ring-[#09419b]"
              />
              <span className="text-sm text-gray-700">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ArrowUpDown size={16} className="text-[#ff2f92]" />
          Ordenar
        </h3>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as SortBy)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#09419b] outline-none"
        >
          <option value="newest">Mais recentes</option>
          <option value="price-asc">Preço: menor → maior</option>
          <option value="price-desc">Preço: maior → menor</option>
        </select>
      </div>
    </div>
  );
}
