"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { getPhotoImageUrl } from "@/lib/photoUrl";

export default function PhotoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const photoId = params.photoId as string;

  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const fetchPhoto = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/photos/${photoId}`);
        if (!res.ok) throw new Error(t("photodetail.notFound"));
        const { photo } = await res.json();
        setPhoto(photo);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("photodetail.err.load"));
      } finally {
        setLoading(false);
      }
    };
    fetchPhoto();
  }, [photoId]);

  const handleAddToCart = () => {
    if (!photo) return;
    addItem({
      id: photo.id,
      photoId: photo.id,
      name: photo.name,
      price: photo.price,
      eventId,
      eventTitle: photo.event?.title || "Evento",
      photographerId: photo.photographer?.id || "",
      photographerName: photo.photographer?.name || "Fotógrafo",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleFavorite = async () => {
    // Favoritar exige login
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!photo) return;
    setFavLoading(true);
    try {
      if (favorited) {
        await fetch(`/api/favorites?photoId=${photo.id}`, { method: "DELETE" });
        setFavorited(false);
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: photo.id }),
        });
        if (res.ok) setFavorited(true);
      }
    } catch {
      // silencioso — não bloqueia a compra
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("photodetail.notFound")}
        </h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href={`/photos/${eventId}`}
          className="inline-block px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b]"
        >
          {t("photodetail.backGallery")}
        </Link>
      </div>
    );
  }

  // Dorsais detetadas (OCR), se houver
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
        {/* Imagem (preview com marca d'água) */}
        <div className="relative aspect-[3/2] bg-gray-200 rounded-xl overflow-hidden">
          <Image
            src={getPhotoImageUrl(photo.key, photo.name)}
            alt={photo.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            unoptimized
          />
          {/* Marca d'água */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white/40 text-4xl font-black rotate-[-20deg] select-none">
              LAPHOTUS · PREVIEW
            </span>
          </div>
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
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            className={`w-full py-3 rounded-lg font-semibold border transition mb-4 disabled:opacity-50 ${
              favorited
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {favorited ? `♥ ${t("photodetail.faved")}` : `♡ ${t("photodetail.addFav")}`}
          </button>

          {/* Info adicional */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
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
