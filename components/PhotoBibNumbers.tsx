"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface PhotoBibNumbersProps {
  photoId: string;
  detectedNumbers?: string[];
  onUpdate?: (numbers: string[]) => Promise<void>;
  editable?: boolean;
}

export default function PhotoBibNumbers({
  photoId,
  detectedNumbers = [],
  onUpdate,
  editable = false,
}: PhotoBibNumbersProps) {
  const { t } = useTranslation();
  const [numbers, setNumbers] = useState<string[]>(detectedNumbers);
  const [newNumber, setNewNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddNumber = () => {
    if (newNumber.trim() && !numbers.includes(newNumber.trim())) {
      setNumbers([...numbers, newNumber.trim()]);
      setNewNumber("");
    }
  };

  const handleRemoveNumber = (num: string) => {
    setNumbers(numbers.filter((n) => n !== num));
  };

  const handleSave = async () => {
    if (!onUpdate) return;

    setSaving(true);
    try {
      await onUpdate(numbers);
      setIsEditing(false);
    } catch (err) {
      console.error("Falha ao atualizar dorsais:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!editable) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">{t("bib.detected.label")}:</p>
        {numbers.length === 0 ? (
          <p className="text-sm text-gray-600 italic">{t("bib.detected.none")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {numbers.map((num) => (
              <span
                key={num}
                className="inline-block px-3 py-1 bg-[#e8f0ff] text-blue-800 rounded-full text-sm font-semibold"
              >
                #{num}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-700">{t("bib.detected.label")}</p>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-[#09419b] hover:text-[#09419b] font-semibold"
          >
            ✎ {t("bib.detected.edit")}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {/* Current numbers */}
          {numbers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {numbers.map((num) => (
                <div
                  key={num}
                  className="flex items-center gap-2 px-3 py-1 bg-[#e8f0ff] text-blue-800 rounded-full text-sm"
                >
                  <span>#{num}</span>
                  <button
                    onClick={() => handleRemoveNumber(num)}
                    className="text-[#09419b] hover:text-blue-800 font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new number */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleAddNumber();
              }}
              placeholder={t("bib.detected.addPlaceholder")}
              maxLength={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleAddNumber}
              className="px-3 py-2 bg-[#09419b] text-white text-sm rounded-lg hover:bg-[#09419b]"
            >
              +
            </button>
          </div>

          {/* Save/Cancel */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-3 py-2 bg-[#f0bf38] text-white text-sm rounded-lg hover:bg-[#f0bf38] disabled:opacity-50"
            >
              {saving ? t("bib.detected.saving") : t("common.save")}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setNumbers(detectedNumbers);
                setNewNumber("");
              }}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      ) : (
        // View mode
        <div className="flex flex-wrap gap-2">
          {numbers.length === 0 ? (
            <p className="text-sm text-gray-600 italic">{t("bib.detected.none")}</p>
          ) : (
            numbers.map((num) => (
              <span
                key={num}
                className="inline-block px-3 py-1 bg-[#e8f0ff] text-blue-800 rounded-full text-sm font-semibold"
              >
                #{num}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}
