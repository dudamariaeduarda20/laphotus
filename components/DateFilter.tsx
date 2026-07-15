"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

type DatePreset = "today" | "week" | "month" | "custom" | "";

type DateFilterProps = {
  onDateChange: (from?: string, to?: string) => void;
};

export default function DateFilter({ onDateChange }: DateFilterProps) {
  const [preset, setPreset] = useState<DatePreset>("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const handlePreset = (selected: DatePreset) => {
    setPreset(selected);
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    switch (selected) {
      case "today":
        from = new Date(today);
        from.setHours(0, 0, 0, 0);
        to = new Date(today);
        to.setHours(23, 59, 59, 999);
        break;
      case "week":
        from = new Date(today);
        from.setDate(today.getDate() - today.getDay()); // Sunday
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6); // Saturday
        to.setHours(23, 59, 59, 999);
        break;
      case "month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "custom":
        // User will set custom dates
        return;
      default:
        onDateChange();
        return;
    }

    onDateChange(from.toISOString(), to.toISOString());
  };

  const handleCustom = () => {
    if (customFrom || customTo) {
      onDateChange(customFrom || undefined, customTo || undefined);
    }
  };

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            setPreset("");
            onDateChange();
          }}
          className={`px-4 py-2 rounded border text-sm font-medium transition ${
            preset === ""
              ? "bg-[#09419b] text-white border-[#09419b]"
              : "bg-white border-gray-300 text-gray-700 hover:border-[#09419b]"
          }`}
        >
          Todos
        </button>

        <button
          onClick={() => handlePreset("today")}
          className={`px-4 py-2 rounded border text-sm font-medium transition ${
            preset === "today"
              ? "bg-[#09419b] text-white border-[#09419b]"
              : "bg-white border-gray-300 text-gray-700 hover:border-[#09419b]"
          }`}
        >
          Hoje
        </button>

        <button
          onClick={() => handlePreset("week")}
          className={`px-4 py-2 rounded border text-sm font-medium transition ${
            preset === "week"
              ? "bg-[#09419b] text-white border-[#09419b]"
              : "bg-white border-gray-300 text-gray-700 hover:border-[#09419b]"
          }`}
        >
          Esta Semana
        </button>

        <button
          onClick={() => handlePreset("month")}
          className={`px-4 py-2 rounded border text-sm font-medium transition ${
            preset === "month"
              ? "bg-[#09419b] text-white border-[#09419b]"
              : "bg-white border-gray-300 text-gray-700 hover:border-[#09419b]"
          }`}
        >
          Este Mês
        </button>

        <button
          onClick={() => setPreset("custom")}
          className={`px-4 py-2 rounded border text-sm font-medium transition ${
            preset === "custom"
              ? "bg-[#09419b] text-white border-[#09419b]"
              : "bg-white border-gray-300 text-gray-700 hover:border-[#09419b]"
          }`}
        >
          Personalizado
        </button>
      </div>

      {/* Custom date range */}
      {preset === "custom" && (
        <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              De
            </label>
            <div className="flex items-center gap-2 px-3 py-2 border rounded bg-white">
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Até
            </label>
            <div className="flex items-center gap-2 px-3 py-2 border rounded bg-white">
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 outline-none text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleCustom}
            className="px-6 py-2 bg-[#09419b] text-white rounded font-semibold hover:opacity-90 transition self-end"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
