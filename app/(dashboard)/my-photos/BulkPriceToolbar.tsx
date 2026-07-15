"use client";

import { useState } from "react";

interface Props {
  selectedCount: number;
  saving: boolean;
  onApply: (price: number) => void;
  onClear: () => void;
}

export default function BulkPriceToolbar({
  selectedCount,
  saving,
  onApply,
  onClear,
}: Props) {
  const [price, setPrice] = useState("");

  if (selectedCount === 0) return null;

  const handleApply = () => {
    const parsed = parseFloat(price);
    if (Number.isNaN(parsed) || parsed < 0) return;
    onApply(parsed);
  };

  return (
    <div className="sticky top-0 z-30 mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-[#09419b] bg-[#e8f0ff] p-4 shadow-sm">
      <span className="text-sm font-semibold text-[#09419b]">
        {selectedCount} foto{selectedCount === 1 ? "" : "s"} selecionada
        {selectedCount === 1 ? "" : "s"}
      </span>
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Novo preço (€)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-36 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#09419b] focus:outline-none"
      />
      <button
        onClick={handleApply}
        disabled={saving || price === ""}
        className="rounded-lg bg-[#09419b] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#09419b]/90 disabled:opacity-50"
      >
        {saving ? "A aplicar…" : "Aplicar a todas"}
      </button>
      <button
        onClick={onClear}
        className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        Limpar seleção
      </button>
    </div>
  );
}
