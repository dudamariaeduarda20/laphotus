"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFavorites } from "@/lib/contexts/FavoritesContext";

interface Props {
  photoId: string;
  size?: "sm" | "md";
  className?: string;
}

/** Coração de favoritar — toggle otimista, qualquer usuário logado, sem gate de compra. */
export default function FavoriteButton({ photoId, size = "sm", className = "" }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [pulsing, setPulsing] = useState(false);

  const favorited = isFavorited(photoId);
  const dim = size === "sm" ? "w-9 h-9 text-lg" : "w-11 h-11 text-2xl";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setPulsing(true);
    setTimeout(() => setPulsing(false), 300);
    toggleFavorite(photoId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorited}
      className={`${dim} flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition ${className}`}
    >
      <span
        className={`transition-transform duration-300 ${pulsing ? "scale-125" : "scale-100"} ${
          favorited ? "text-[#ff2f92]" : "text-gray-400"
        }`}
      >
        {favorited ? "♥" : "♡"}
      </span>
    </button>
  );
}
