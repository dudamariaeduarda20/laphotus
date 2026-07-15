"use client";

import { useLocationAutocomplete } from "@/lib/hooks/useLocationAutocomplete";
import { Search, X } from "lucide-react";

type LocationFilterProps = {
  value?: string;
  onChange: (location: string) => void;
};

export default function LocationFilter({
  value = "",
  onChange,
}: LocationFilterProps) {
  const {
    input,
    setInput,
    suggestions,
    isOpen,
    setIsOpen,
    handleInputChange,
    handleSelectLocation,
  } = useLocationAutocomplete();

  const handleSelect = (location: string) => {
    handleSelectLocation(location);
    onChange(location);
  };

  const handleClear = () => {
    setInput("");
    onChange("");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#09419b]">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por localização..."
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => input && setIsOpen(true)}
          className="flex-1 outline-none text-sm"
        />
        {input && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={16} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
          {suggestions.map((location) => (
            <button
              key={location}
              onClick={() => handleSelect(location)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm first:rounded-t-lg last:rounded-b-lg"
            >
              {location}
            </button>
          ))}
        </div>
      )}

      {isOpen && suggestions.length === 0 && input && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg px-4 py-2 text-sm text-gray-500 shadow-lg">
          Sem resultados
        </div>
      )}
    </div>
  );
}
