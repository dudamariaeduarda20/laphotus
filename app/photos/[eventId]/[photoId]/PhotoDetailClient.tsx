"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/contexts/CartContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import ShareButtons from "./ShareButtons";
import ReviewSection from "./ReviewSection";
import FavoriteActionButton from "@/components/FavoriteActionButton";
import { useFavorites } from "@/lib/contexts/FavoritesContext";

interface PhotoDetailData {
  id: string;
  name: string;
  key: string;
  price: number;
  isPremium: boolean;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  detectedBibNumbers: string | null;
  event?: { id: string; title: string } | null;
  photographer?: { id: string; user?: { name: string } | null } | null;
}

interface Props {
  eventId: string;
  photoId: string;
  photo: PhotoDetailData;
  shareUrl: string;
}

export default function PhotoDetailClient({ eventId, photoId, photo, shareUrl }: Props) {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const { isFavorited } = useFavorites();
  const [added, setAdded] = useState(false);
  const favorited = isFavorited(photo.id);

  const handleAddToCart = () => {
    addItem({
      id: photo.id,
      photoId: photo.id,
      name: photo.name,
      price: photo.price,
      eventId,
      eventTitle: photo.event?.title || "Evento",
      photographerId: photo.photographer?.id || "",
      photographerName: photo.photographer?.user?.name || "Fotógrafo",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  let bibNumbers: string[] = [];
  try {
    if (photo.detectedBibNumbers) {
      const parsed = JSON.parse(photo.detectedBibNumbers);
      bibNumbers = Array.isArray(parsed)
        ? parsed.map((n: any) => (typeof n === "string" ? n : n.number))
        : [];
    }
  } catch {
    bibNumbers = [];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500 flex items-center gap-2">
        <Link href="/photos" className="hover:text-[#09419b]">
          {t("nav.events")}
        </Link>
        <span>/</span>
        <Link href={`/photos/${eventId}`} className="hover:text-[#09419b]">
          {photo.event?.title || "Evento"}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{photo.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagem — marca d'água real nos pixels, servida por /api/photos/[id]/preview.
            Nunca aponta pro arquivo original (esse só sai pelo download pago). */}
        <div className="relative aspect-[3/2] bg-gray-200 rounded-xl overflow-hidden">
          <Image
            src={`/api/photos/${photo.id}/preview?size=detail`}
            alt={photo.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            unoptimized
          />
          {photo.isPremium && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              PREMIUM
            </div>
          )}
        </div>

        {/* Detalhes */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {photo.name}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("photodetail.eventLabel")}{" "}
            <Link
              href={`/photos/${eventId}`}
              className="text-[#09419b] hover:underline"
            >
              {photo.event?.title || "Evento"}
            </Link>
          </p>

          {/* Preço */}
          <div className="mb-6">
            {photo.price > 0 ? (
              <span className="text-4xl font-bold text-[#f0bf38]">
                € {photo.price.toFixed(2)}
              </span>
            ) : (
              <span className="text-2xl font-semibold text-gray-500">
                {t("photo.free")}
              </span>
            )}
            <span className="block text-sm text-gray-500 mt-1">
              {t("photodetail.taxInfo")}
            </span>
          </div>

          {/* Adicionar ao carrinho */}
          <button
            onClick={handleAddToCart}
            className={`w-full py-3 rounded-lg font-semibold text-white transition mb-3 ${
              added
                ? "bg-[#f0bf38]"
                : "bg-[#09419b] hover:bg-[#09419b]"
            }`}
          >
            {added ? `✓ ${t("photodetail.added")}` : t("photodetail.addToCart")}
          </button>

          {/* Favoritar */}
          <FavoriteActionButton photoId={photo.id} favorited={favorited} />

          {/* Partilhar */}
          <ShareButtons url={shareUrl} title={photo.name} />

          {/* Info adicional */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm mt-4">
            {photo.width && photo.height && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t("photodetail.resolution")}</span>
                <span className="font-medium text-gray-900">
                  {photo.width} × {photo.height}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">{t("photodetail.format")}</span>
              <span className="font-medium text-gray-900">
                {photo.mimeType || "image/jpeg"}
              </span>
            </div>
            {bibNumbers.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t("photodetail.bibsDetected")}</span>
                <span className="font-medium text-gray-900">
                  {bibNumbers.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewSection photoId={photo.id} />

      {/* Voltar */}
      <div className="mt-10 border-t border-gray-200 pt-6">
        <Link
          href={`/photos/${eventId}`}
          className="text-[#09419b] hover:text-[#09419b] font-semibold flex items-center gap-2"
        >
          ← {t("photodetail.backEventGallery")}
        </Link>
      </div>
    </div>
  );
}
