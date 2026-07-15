"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhotoBibNumbers from "@/components/PhotoBibNumbers";
import { getPhotoImageUrl } from "@/lib/photoUrl";

interface PhotoRow {
  id: string;
  name: string;
  status: "AVAILABLE" | "ARCHIVED" | "UPLOADING" | "PROCESSING";
  key: string;
  thumbnailKey: string | null;
  detectedBibNumbers: string | null;
  eventId: string;
  event?: { title: string; sport: string };
  _count?: { orderItems: number };
}

export default function MyPhotosPage() {
  const { isPhotographer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBibsId, setEditingBibsId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (authLoading) return;

    if (!isPhotographer) {
      router.push("/dashboard");
      return;
    }

    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      setPhotos(
        photos.map((p) =>
          p.id === photoId
            ? {
                ...p,
                detectedBibNumbers: JSON.stringify(
                  bibNumbers.map((n) => ({ number: n, confidence: 1.0 }))
                ),
              }
            : p
        )
      );
      setEditingBibsId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };


  const handleToggleStatus = async (photo: PhotoRow) => {
    const nextStatus = photo.status === "AVAILABLE" ? "ARCHIVED" : "AVAILABLE";
    setSavingId(photo.id);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao atualizar estado");
      }
      setPhotos(
        photos.map((p) => (p.id === photo.id ? { ...p, status: nextStatus } : p))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar estado");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (photo: PhotoRow) => {
    const soldCount = photo._count?.orderItems ?? 0;
    const confirmMsg =
      soldCount > 0
        ? `Esta foto já foi vendida ${soldCount}x. Não pode ser apagada — vai ser arquivada (some da loja, mas os pedidos já pagos continuam intactos). Continuar?`
        : "Apagar esta foto definitivamente? Esta ação não pode ser desfeita.";
    if (!confirm(confirmMsg)) return;

    setSavingId(photo.id);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao apagar");
      }
      const result = await res.json();
      if (result.archived) {
        setPhotos(
          photos.map((p) =>
            p.id === photo.id ? { ...p, status: "ARCHIVED" as const } : p
          )
        );
      } else {
        setPhotos(photos.filter((p) => p.id !== photo.id));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao apagar");
    } finally {
      setSavingId(null);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Fotos</h1>
      <p className="text-gray-600 mb-8">
        Visibilidade, dorsais e vendas de cada foto
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

            const soldCount = photo._count?.orderItems ?? 0;
            const isArchived = photo.status === "ARCHIVED";
            const isBusy = savingId === photo.id;

            return (
              <div
                key={photo.id}
                className={`bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition ${
                  isArchived ? "opacity-60" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-40 bg-gray-200">
                  <img
                    src={getPhotoImageUrl(photo.thumbnailKey || photo.key, photo.name)}
                    alt={photo.name}
                    className="h-full w-full object-cover"
                  />
                  {soldCount > 0 && (
                    <span className="absolute right-2 top-2 rounded-full bg-[#ff2f92] px-2 py-0.5 text-xs font-bold text-white">
                      {soldCount} vendida{soldCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {photo.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {photo.event?.title || `Evento ${photo.eventId.substring(0, 8)}`}
                      {photo.event?.sport ? ` · ${photo.event.sport}` : ""}
                    </p>
                  </div>

                  {/* Bib Numbers */}
                  {editingBibsId === photo.id ? (
                    <PhotoBibNumbers
                      photoId={photo.id}
                      detectedNumbers={bibNumbers}
                      onUpdate={(nums) => handleUpdateBibNumbers(photo.id, nums)}
                      editable
                    />
                  ) : (
                    <PhotoBibNumbers
                      photoId={photo.id}
                      detectedNumbers={bibNumbers}
                      editable={false}
                    />
                  )}

                  {/* State Badge */}
                  <div className="bg-[#fef7e8] rounded p-2 text-xs">
                    <span className="text-gray-600">Estado:</span>
                    <p className="font-bold text-[#f0bf38]">
                      {isArchived ? "Oculta" : "Visível"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setEditingBibsId(photo.id)}
                      disabled={editingBibsId === photo.id}
                      className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      # Dorsais
                    </button>
                    <button
                      onClick={() => handleToggleStatus(photo)}
                      disabled={isBusy}
                      className="rounded-lg bg-[#fef7e8] px-3 py-2 text-xs font-semibold text-[#f0bf38] hover:bg-[#fef7e8]/70 disabled:opacity-50"
                    >
                      {isArchived ? "👁 Ver" : "🚫 Ocultar"}
                    </button>
                    <button
                      onClick={() => handleDelete(photo)}
                      disabled={isBusy}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      🗑 Apagar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
