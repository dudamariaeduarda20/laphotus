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
      <form onSubmit={submit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("home.search.placeholder")}
          className="flex-1 px-6 py-4 rounded-full bg-white/95 dark:bg-gray-800/80 text-gray-900 dark:text-white text-lg shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur transition-smooth placeholder:text-gray-500"
        />
        <button
          type="submit"
          className="px-8 py-4 bg-gradient-to-r from-white to-[#e8f0ff] dark:from-white/10 dark:to-white/5 text-[#09419b] dark:text-white rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-white/50 hover:scale-105 transition-smooth shadow-xl"
        >
          🔍 {t("home.search.button")}
        </button>
      </form>

      <button
        onClick={() => setModalOpen(true)}
        className="mt-4 text-sm text-white/80 hover:text-white transition-smooth font-medium"
      >
        → {t("home.search.unknown")}
      </button>

      <AdvancedSearchModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
