"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  photoName: string;
  currentPrice: number;
  saving: boolean;
  onSave: (price: number) => void;
  onClose: () => void;
}

export default function EditPriceModal({
  photoName,
  currentPrice,
  saving,
  onSave,
  onClose,
}: Props) {
  const [price, setPrice] = useState(currentPrice.toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(price);
    if (Number.isNaN(parsed) || parsed < 0) return;
    onSave(parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="mb-1 text-lg font-bold text-gray-900">Editar Preço</h3>
        <p className="mb-4 text-sm text-gray-600 line-clamp-1">{photoName}</p>

        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Preço (€)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#09419b] focus:outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[#09419b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#09419b]/90 disabled:opacity-50"
            >
              {saving ? "A guardar…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
