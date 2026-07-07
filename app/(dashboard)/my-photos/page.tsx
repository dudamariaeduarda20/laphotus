"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhotoBibNumbers from "@/components/PhotoBibNumbers";

export default function MyPhotosPage() {
  const { isPhotographer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isPhotographer) {
      router.push("/dashboard");
      return;
    }

    const fetchPhotos = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/photos?own=true");
        if (!res.ok) throw new Error("Falha ao carregar fotos");

        const { photos } = await res.json();
        setPhotos(photos);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar");
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [isPhotographer, authLoading, router]);

  const handleUpdateBibNumbers = async (
    photoId: string,
    bibNumbers: string[]
  ) => {
    try {
      const res = await fetch(`/api/photos/${photoId}/bibnumbers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumbers }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao atualizar");
      }

      // Update local state
      setPhotos(
        photos.map((p) => {
          if (p.id === photoId) {
            return {
              ...p,
              detectedBibNumbers: JSON.stringify(
                bibNumbers.map((n) => ({ number: n, confidence: 1.0 }))
              ),
            };
          }
          return p;
        })
      );

      setEditingPhotoId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Fotos</h1>
      <p className="text-gray-600 mb-8">
        Veja e edite as dorsais detectadas nas suas fotos
      </p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
          {error}
        </div>
      )}

      {photos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📸</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Sem fotos ainda
          </h2>
          <p className="text-gray-600 mb-6">
            Carregue suas primeiras fotos para começar!
          </p>
          <Link
            href="/upload"
            className="inline-block px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b]"
          >
            Carregar Fotos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => {
            const bibNumbers = (() => {
              try {
                return photo.detectedBibNumbers
                  ? JSON.parse(photo.detectedBibNumbers).map(
                      (n: any) => n.number
                    )
                  : [];
              } catch {
                return [];
              }
            })();

            return (
              <div
                key={photo.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                {/* Placeholder */}
                <div className="h-40 bg-gray-200 flex items-center justify-center text-4xl">
                  📸
                </div>

                {/* Info */}
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {photo.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Evento ID: {photo.eventId.substring(0, 8)}
                    </p>
                  </div>

                  {/* Bib Numbers */}
                  {editingPhotoId === photo.id ? (
                    <PhotoBibNumbers
                      photoId={photo.id}
                      detectedNumbers={bibNumbers}
                      onUpdate={(nums) =>
                        handleUpdateBibNumbers(photo.id, nums)
                      }
                      editable
                    />
                  ) : (
                    <PhotoBibNumbers
                      photoId={photo.id}
                      detectedNumbers={bibNumbers}
                      editable={false}
                    />
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#e8f0ff] rounded p-2">
                      <span className="text-gray-600">Preço:</span>
                      <p className="font-bold text-[#09419b]">
                        € {photo.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-[#fef7e8] rounded p-2">
                      <span className="text-gray-600">Estado:</span>
                      <p className="font-bold text-[#f0bf38]">{photo.status}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {editingPhotoId !== photo.id && (
                    <button
                      onClick={() => setEditingPhotoId(photo.id)}
                      className="w-full px-3 py-2 bg-[#09419b] text-white text-sm rounded-lg hover:bg-[#09419b] font-semibold"
                    >
                      ✎ Editar Dorsais
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
