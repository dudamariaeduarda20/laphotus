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
      <form onSubmit={submit} className="flex gap-6 border-b border-[#ddd] pb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("home.search.placeholder")}
          className="input-minimal flex-1 text-lg"
        />
        <button type="submit" className="btn-primary">
          🔍 {t("home.search.button")}
        </button>
      </form>

      <button
        onClick={() => setModalOpen(true)}
        className="mt-4 text-sm text-[#666] hover:text-[#09419b] transition font-medium"
      >
        {t("home.search.unknown")}
      </button>

      <AdvancedSearchModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
