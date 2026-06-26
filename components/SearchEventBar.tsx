"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdvancedSearchModal from "./AdvancedSearchModal";

/**
 * Hero de busca da home: campo grande para o nome do evento + botão,
 * e link "não sabe o nome?" que abre o modal de busca avançada.
 */
export default function SearchEventBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/photos?search=${encodeURIComponent(q)}` : "/photos");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Comece a digitar o nome do evento…"
          className="flex-1 px-5 py-4 rounded-xl text-gray-900 text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
        />
        <button
          type="submit"
          className="px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-lg"
        >
          🔍 Buscar
        </button>
      </form>

      <button
        onClick={() => setModalOpen(true)}
        className="mt-3 text-sm text-white/90 underline hover:text-white"
      >
        Não sabe o nome do evento?
      </button>

      <AdvancedSearchModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
