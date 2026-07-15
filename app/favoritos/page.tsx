"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PhotoCard from "@/components/PhotoCard";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFavorites } from "@/lib/contexts/FavoritesContext";

interface FavoritePhoto {
  id: string;
  eventId: string;
  name: string;
  key: string;
  price: number;
  isPremium: boolean;
  photographer?: { id: string; userId: string; bio?: string | null };
}

export default function FavoritesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { favoriteIds } = useFavorites();
  const [photos, setPhotos] = useState<FavoritePhoto[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setPhotos([]);
      return;
    }
    fetch("/api/favorites", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { favorites: [] }))
      .then((data) => setPhotos(data.favorites || []));
  }, [isAuthenticated, authLoading]);

  // Filtra pela verdade viva do contexto — desfavoritar aqui remove na hora.
  const visible = (photos || []).filter((p) => favoriteIds.has(p.id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Favoritos</h1>
      <p className="text-gray-600 mb-8">Fotos que marcou com ♥ para encontrar mais tarde.</p>

      {photos === null ? (
        <div className="text-gray-500">A carregar…</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <div className="text-5xl mb-4">♡</div>
          <p className="text-lg font-semibold text-gray-700 mb-1">Ainda sem favoritos</p>
          <p className="text-gray-500 mb-6">
            Explore os eventos e marque as fotos que gostar clicando no coração.
          </p>
          <Link
            href="/photos"
            className="inline-block px-6 py-3 bg-[#09419b] text-white rounded-full font-semibold hover:bg-[#09419b]/90 transition"
          >
            Explorar fotos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} eventId={photo.eventId} />
          ))}
        </div>
      )}
    </div>
  );
}
