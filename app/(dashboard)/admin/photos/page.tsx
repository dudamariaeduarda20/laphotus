"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { getPhotoImageUrl } from "@/lib/photoUrl";
import RejectReasonModal from "@/components/RejectReasonModal";

interface PhotoRow {
  id: string;
  name: string;
  key: string;
  thumbnailKey: string | null;
  status: string;
  createdAt: string;
  event: { title: string };
  photographer: { user: { name: string; email: string } };
  _count: { reports: number };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: "Aprovada", color: "bg-[#e8f0ff] text-blue-800" },
  ARCHIVED: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
  UPLOADING: { label: "A enviar", color: "bg-gray-100 text-gray-700" },
  PROCESSING: { label: "A processar", color: "bg-gray-100 text-gray-700" },
};

export default function AdminPhotosPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchPhotos = async (status: string) => {
    setLoading(true);
    try {
      const qs = status ? `?status=${status}` : "";
      const res = await fetch(`/api/admin/photos${qs}`);
      if (!res.ok) throw new Error("Falha ao carregar fotos");
      const { photos } = await res.json();
      setPhotos(photos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchPhotos(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, authLoading, router, statusFilter]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/photos/${id}/approve`, { method: "PUT" });
      if (!res.ok) throw new Error("Falha ao aprovar");
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "AVAILABLE" } : p))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectingId) return;
    setBusyId(rejectingId);
    try {
      const res = await fetch(`/api/admin/photos/${rejectingId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao rejeitar");
      }
      setPhotos((prev) =>
        prev.map((p) => (p.id === rejectingId ? { ...p, status: "ARCHIVED" } : p))
      );
      setRejectingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyId(null);
    }
  };

  const rejectingPhoto = photos.find((p) => p.id === rejectingId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moderação de Fotos</h1>
        <p className="text-gray-600 mt-2">Aprovar ou rejeitar fotos publicadas na loja</p>
      </div>

      <div className="flex gap-2">
        {[
          { value: "", label: "Todas" },
          { value: "AVAILABLE", label: "Aprovadas" },
          { value: "ARCHIVED", label: "Rejeitadas" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              statusFilter === opt.value
                ? "bg-[#09419b] text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
          Nenhuma foto encontrada
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => {
            const statusInfo = STATUS_LABEL[photo.status] || STATUS_LABEL.AVAILABLE;
            const isBusy = busyId === photo.id;
            return (
              <div key={photo.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="relative h-40 bg-gray-200">
                  <img
                    src={getPhotoImageUrl(photo.thumbnailKey || photo.key, photo.name)}
                    alt={photo.name}
                    className="h-full w-full object-cover"
                  />
                  <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  {photo._count.reports > 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#ff2f92] px-2 py-0.5 text-xs font-bold text-white">
                      🚩 {photo._count.reports}
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{photo.name}</h3>
                    <p className="text-sm text-gray-600">{photo.event.title}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Fotógrafo: {photo.photographer.user.name}</p>
                    <p>Enviada: {new Date(photo.createdAt).toLocaleDateString("pt-PT")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApprove(photo.id)}
                      disabled={isBusy || photo.status === "AVAILABLE"}
                      className="rounded-lg bg-[#09419b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#09419b]/90 disabled:opacity-50"
                    >
                      ✓ Aprovar
                    </button>
                    <button
                      onClick={() => setRejectingId(photo.id)}
                      disabled={isBusy || photo.status === "ARCHIVED"}
                      className="rounded-lg bg-[#ff2f92] px-3 py-2 text-xs font-semibold text-white hover:bg-[#ff2f92]/90 disabled:opacity-50"
                    >
                      ✕ Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectingPhoto && (
        <RejectReasonModal
          itemName={rejectingPhoto.name}
          saving={busyId === rejectingPhoto.id}
          onConfirm={handleReject}
          onClose={() => setRejectingId(null)}
        />
      )}
    </div>
  );
}
