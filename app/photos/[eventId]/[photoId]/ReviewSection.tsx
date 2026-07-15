"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import StarRating from "@/components/StarRating";
import StarRatingInput from "@/components/StarRatingInput";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
}

interface OwnReview {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
}

interface ReviewsData {
  reviews: ReviewRow[];
  averageRating: number;
  reviewCount: number;
  ownReview: OwnReview | null;
  canReview: boolean;
}

const STATUS_NOTE: Record<string, { text: string; className: string }> = {
  pending: {
    text: "A sua avaliação está pendente de aprovação e ainda não é pública.",
    className: "bg-[#fef7e8] text-[#f0bf38]",
  },
  rejected: {
    text: "A sua avaliação foi rejeitada pela moderação.",
    className: "bg-red-50 text-red-700",
  },
};

interface Props {
  photoId: string;
}

export default function ReviewSection({ photoId }: Props) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/photos/${photoId}/reviews`, { credentials: "include" });
      if (!res.ok) return;
      const json: ReviewsData = await res.json();
      setData(json);
      if (json.ownReview) {
        setRating(json.ownReview.rating);
        setComment(json.ownReview.comment || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/photos/${photoId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao enviar avaliação");
      }
      await fetchReviews();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar avaliação");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return null;

  const statusNote = data.ownReview ? STATUS_NOTE[data.ownReview.status] : null;

  return (
    <div className="mt-10 border-t border-gray-200 pt-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Avaliações</h2>
        {data.reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={data.averageRating} size="md" />
            <span className="text-sm text-gray-600">
              {data.averageRating.toFixed(1)} ({data.reviewCount})
            </span>
          </div>
        )}
      </div>

      {/* Formulário — só quem comprou a foto */}
      {data.canReview && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {data.ownReview ? "Editar a sua avaliação" : "Avalie esta foto"}
          </p>
          <StarRatingInput value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Comentário (opcional)"
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#09419b] focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || rating < 1}
            className="mt-3 rounded-lg bg-[#09419b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#09419b]/90 disabled:opacity-50"
          >
            {saving ? "A enviar…" : data.ownReview ? "Atualizar" : "Enviar avaliação"}
          </button>
          {statusNote && (
            <p className={`mt-3 rounded px-3 py-2 text-xs font-medium ${statusNote.className}`}>
              {statusNote.text}
            </p>
          )}
        </form>
      )}

      {!data.canReview && isAuthenticated && (
        <p className="mb-8 text-sm text-gray-500">
          Só quem comprou esta foto pode avaliar.
        </p>
      )}

      {/* Lista de avaliações aprovadas */}
      {data.reviews.length === 0 ? (
        <p className="text-sm text-gray-500">Ainda sem avaliações públicas.</p>
      ) : (
        <ul className="space-y-4">
          {data.reviews.map((r) => (
            <li key={r.id} className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <StarRating rating={r.rating} />
                <span className="text-sm font-semibold text-gray-900">{r.user.name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString("pt-PT")}
                </span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-gray-700">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
