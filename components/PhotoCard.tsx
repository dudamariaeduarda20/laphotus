"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/contexts/CartContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useState } from "react";
import StarRating from "./StarRating";
import FavoriteButton from "./FavoriteButton";
import { getConfidenceColor } from "@/lib/utils/faceMatchUtils";

interface PhotoCardProps {
  photo: {
    id: string;
    name: string;
    key: string;
    price: number;
    isPremium: boolean;
    averageRating?: number;
    reviewCount?: number;
    matchPercent?: number;
    matchPercentile?: number;
    clusterCount?: number;
    clusterId?: string;
    photographer?: {
      id: string;
      userId: string;
      bio?: string | null;
    };
  };
  eventId: string;
  event?: {
    id: string;
    title: string;
    organizer?: {
      organizationName: string;
    };
  };
  onClusterClick?: (clusterId: string) => void;
}

export default function PhotoCard({
  photo,
  eventId,
  event,
  onClusterClick,
}: PhotoCardProps) {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: photo.id,
      photoId: photo.id,
      name: photo.name,
      price: photo.price,
      eventId,
      eventTitle: event?.title || "Event",
      photographerId: photo.photographer?.id || "",
      photographerName: photo.photographer?.userId || "Unknown",
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/photos/${eventId}/${photo.id}`}>
      <div className="group bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
        {/* Image Container */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
            {/* Placeholder */}
            <div className="text-6xl opacity-20">📸</div>
          </div>

          {/* Marca d'água real nos pixels, via /api/photos/[id]/preview — nunca
              o arquivo original (mesmo endpoint usado na página de detalhe). */}
          {photo.key && (
            <Image
              src={`/api/photos/${photo.id}/preview?size=thumb`}
              alt={photo.name}
              fill
              className="object-cover group-hover:scale-105 transition"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          )}

          {/* Badge */}
          {photo.isPremium && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
              PREMIUM
            </div>
          )}

          {/* Cluster count badge — clickable to expand */}
          {(photo.clusterCount || 0) > 1 && photo.clusterId && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onClusterClick?.(photo.clusterId!);
              }}
              className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold shadow cursor-pointer transition"
            >
              +{photo.clusterCount! - 1}
            </button>
          )}

          {/* Match score (busca facial) — canto inferior esquerdo, cor por confiança */}
          {typeof photo.matchPercent === "number" && (
            <div
              className={`absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-bold shadow ${
                photo.matchPercentile
                  ? getConfidenceColor(photo.matchPercentile)
                  : "bg-[#09419b] text-white"
              }`}
            >
              {photo.matchPercent}%{photo.matchPercentile ? ` (top ${100 - photo.matchPercentile}%)` : " match"}
            </div>
          )}

          {/* Favoritar */}
          <FavoriteButton photoId={photo.id} className="absolute top-2 left-2" />

          {/* Overlay on hover — pointer-events-none pra não tapar o clique do coração */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition">
              <div className="text-white text-center">
                <div className="text-2xl mb-2">👁️</div>
                <div className="text-sm font-semibold">{t("photo.viewDetails")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm">
            {photo.name}
          </h3>

          {!!photo.reviewCount && (
            <div className="mb-2 flex items-center gap-1">
              <StarRating rating={photo.averageRating || 0} />
              <span className="text-xs text-gray-500">({photo.reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              {photo.price > 0 ? (
                <span className="text-lg font-bold text-[#f0bf38]">
                  € {photo.price.toFixed(2)}
                </span>
              ) : (
                <span className="text-sm text-gray-500">{t("photo.free")}</span>
              )}
            </div>

            {/* Button */}
            <button
              onClick={handleAddToCart}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                added
                  ? "bg-[#f0bf38] text-white"
                  : "bg-[#09419b] text-white hover:bg-[#09419b]"
              }`}
            >
              {added ? "✓" : "+"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
