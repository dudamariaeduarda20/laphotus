import { useState, useCallback, useRef, useEffect } from "react";

export function useLocationAutocomplete() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/events/locations?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setSuggestions(data.locations || []);
      setIsOpen(true);
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSelectLocation = (location: string) => {
    setInput(location);
    setIsOpen(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return {
    input,
    setInput,
    suggestions,
    isOpen,
    setIsOpen,
    handleInputChange,
    handleSelectLocation,
  };
}
