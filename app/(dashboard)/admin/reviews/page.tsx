"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  photo: { id: string; name: string };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-[#fef7e8] text-[#f0bf38]" },
  approved: { label: "Aprovada", color: "bg-[#e8f0ff] text-blue-800" },
  rejected: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[#f0bf38]">
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReviews = async (status: string) => {
    setLoading(true);
    try {
      const qs = status ? `?status=${status}` : "";
      const res = await fetch(`/api/admin/reviews${qs}`);
      if (!res.ok) throw new Error("Falha ao carregar avaliações");
      const { reviews } = await res.json();
      setReviews(reviews);
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
    fetchReviews(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, authLoading, router, statusFilter]);

  const handleDecision = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}/${action}`, { method: "PUT" });
      if (!res.ok) throw new Error("Falha ao atualizar");
      const newStatus = action === "approve" ? "approved" : "rejected";
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moderação de Avaliações</h1>
        <p className="text-gray-600 mt-2">Aprovar ou rejeitar comentários/notas de fotos</p>
      </div>

      <div className="flex gap-2">
        {[
          { value: "pending", label: "Pendentes" },
          { value: "approved", label: "Aprovadas" },
          { value: "rejected", label: "Rejeitadas" },
          { value: "", label: "Todas" },
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {reviews.length === 0 ? (
            <div className="p-12 text-center text-gray-600">Nenhuma avaliação encontrada</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviews.map((review) => {
                const isBusy = busyId === review.id;
                const statusInfo = STATUS_LABEL[review.status] || STATUS_LABEL.pending;
                return (
                  <div key={review.id} className="p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Stars rating={review.rating} />
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900">{review.photo.name}</p>
                        <p className="text-sm text-gray-600">
                          {review.user.name} ({review.user.email})
                        </p>
                        {review.comment && (
                          <p className="mt-2 text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(review.createdAt).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                      {review.status === "pending" && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleDecision(review.id, "approve")}
                            disabled={isBusy}
                            className="px-3 py-1 bg-[#09419b] text-white text-sm rounded hover:bg-[#09419b]/90 disabled:opacity-50"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            onClick={() => handleDecision(review.id, "reject")}
                            disabled={isBusy}
                            className="px-3 py-1 bg-[#ff2f92] text-white text-sm rounded hover:bg-[#ff2f92]/90 disabled:opacity-50"
                          >
                            ✕ Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
