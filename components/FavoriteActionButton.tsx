"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFavorites } from "@/lib/contexts/FavoritesContext";

interface Props {
  photoId: string;
  favorited: boolean;
}

/** Full-width labeled favorite toggle — página de detalhe da foto. */
export default function FavoriteActionButton({ photoId, favorited }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { toggleFavorite } = useFavorites();
  const [pulsing, setPulsing] = useState(false);

  const handleClick = () => {
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
      className={`w-full py-3 rounded-lg font-semibold border transition mb-4 ${
        favorited
          ? "border-[#ff2f92]/40 bg-[#ff2f92]/10 text-[#ff2f92]"
          : "border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className={`inline-block transition-transform duration-300 ${pulsing ? "scale-125" : "scale-100"}`}>
        {favorited ? "♥" : "♡"}
      </span>{" "}
      {favorited ? "Nos favoritos" : "Adicionar aos favoritos"}
    </button>
  );
}
