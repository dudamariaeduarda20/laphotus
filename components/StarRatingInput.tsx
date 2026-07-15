"use client";

import { useState } from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

/** Clickable 1-5 star selector for the review form. */
export default function StarRatingInput({ value, onChange }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="text-3xl leading-none transition"
        >
          <span className={star <= display ? "text-[#f0bf38]" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  );
}
