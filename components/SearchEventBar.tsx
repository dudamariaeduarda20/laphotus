"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/hooks/useTranslation";
import AdvancedSearchModal from "./AdvancedSearchModal";

/**
 * Hero de busca da home: campo grande para o nome do evento + botão,
 * e link "não sabe o nome?" que abre o modal de busca avançada.
 */
export default function SearchEventBar() {
  const router = useRouter();
  const { t } = useTranslation();
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
          placeholder={t("home.search.placeholder")}
          className="flex-1 px-5 py-4 rounded-xl text-gray-900 text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
        />
        <button
          type="submit"
          className="px-6 py-4 bg-[#09419b] text-white rounded-xl font-semibold text-lg hover:bg-[#09419b] transition shadow-lg"
        >
          🔍 {t("home.search.button")}
        </button>
      </form>

      <button
        onClick={() => setModalOpen(true)}
        className="mt-3 text-sm text-white/90 underline hover:text-white"
      >
        {t("home.search.unknown")}
      </button>

      <AdvancedSearchModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
