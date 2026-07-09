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
    <div className="w-full max-w-3xl">
      <form onSubmit={submit} className="flex gap-3 items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("home.search.placeholder")}
          className="flex-1 max-w-lg rounded-full border border-white/50 bg-transparent px-8 py-4 text-lg text-white placeholder-white/60 focus:outline-none focus:border-white transition"
        />
        <button
          type="submit"
          className="rounded-full bg-[#ff2f92] text-white font-medium text-lg px-10 py-4 hover:bg-[#ff54a6] transition"
        >
          {t("home.search.button")}
        </button>
      </form>

      <button
        onClick={() => setModalOpen(true)}
        className="mt-4 text-base text-white/80 hover:text-white transition font-medium"
      >
        {t("home.search.unknown")}
      </button>

      <AdvancedSearchModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
