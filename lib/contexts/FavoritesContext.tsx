"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isLoaded: boolean;
  isFavorited: (photoId: string) => boolean;
  toggleFavorite: (photoId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      setIsLoaded(true);
      return;
    }
    fetch("/api/favorites", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { favorites: [] }))
      .then((data) => {
        setFavoriteIds(new Set((data.favorites || []).map((p: { id: string }) => p.id)));
      })
      .finally(() => setIsLoaded(true));
  }, [isAuthenticated]);

  const isFavorited = useCallback(
    (photoId: string) => favoriteIds.has(photoId),
    [favoriteIds]
  );

  // Otimista: alterna localmente já, persiste depois. Reverte se a API falhar.
  const toggleFavorite = useCallback(
    async (photoId: string) => {
      const wasFavorited = favoriteIds.has(photoId);

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        wasFavorited ? next.delete(photoId) : next.add(photoId);
        return next;
      });

      try {
        if (wasFavorited) {
          await fetch(`/api/favorites?photoId=${photoId}`, {
            method: "DELETE",
            credentials: "include",
          });
        } else {
          const res = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ photoId }),
          });
          if (!res.ok && res.status !== 400) throw new Error("Falha ao favoritar");
        }
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          wasFavorited ? next.add(photoId) : next.delete(photoId);
          return next;
        });
      }
    },
    [favoriteIds]
  );

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isLoaded, isFavorited, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
