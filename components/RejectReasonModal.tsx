"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  itemName: string;
  saving: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export default function RejectReasonModal({
  itemName,
  saving,
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) return;
    onConfirm(reason.trim());
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

        <h3 className="mb-1 text-lg font-bold text-gray-900">Rejeitar</h3>
        <p className="mb-4 text-sm text-gray-600 line-clamp-1">{itemName}</p>

        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Motivo (enviado por email)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#ff2f92] focus:outline-none"
            placeholder="Explique o motivo da rejeição…"
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
              disabled={saving || reason.trim().length < 3}
              className="flex-1 rounded-lg bg-[#ff2f92] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff2f92]/90 disabled:opacity-50"
            >
              {saving ? "A rejeitar…" : "Rejeitar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
