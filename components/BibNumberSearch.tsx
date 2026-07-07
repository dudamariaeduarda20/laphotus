"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface BibNumberSearchProps {
  eventId: string;
  onSearch: (bibNumber: string) => void;
}

export default function BibNumberSearch({
  eventId,
  onSearch,
}: BibNumberSearchProps) {
  const { t } = useTranslation();
  const [bibNumber, setBibNumber] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!bibNumber.trim()) {
      return;
    }

    setSearching(true);
    onSearch(bibNumber);
    setSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        🏃 {t("bib.label")}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={bibNumber}
          onChange={(e) => setBibNumber(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t("bib.placeholder")}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          maxLength={3}
        />
        <button
          onClick={handleSearch}
          disabled={searching || !bibNumber.trim()}
          className="px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] disabled:opacity-50 font-semibold"
        >
          {searching ? t("bib.searching") : t("common.search")}
        </button>
        {bibNumber && (
          <button
            onClick={() => {
              setBibNumber("");
              onSearch("");
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            ✕ {t("bib.clear")}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-600">
        {t("bib.hint")}
      </p>
    </div>
  );
}
