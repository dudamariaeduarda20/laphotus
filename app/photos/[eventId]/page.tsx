"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PhotoGrid from "@/components/PhotoGrid";
import BibNumberSearch from "@/components/BibNumberSearch";
import SelfieUpload from "@/components/SelfieUpload";
import FaceCameraSearch from "@/components/FaceCameraSearch";
import PriceFilter from "@/components/PriceFilter";
import { useCart } from "@/lib/contexts/CartContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { groupMatchesByCluster } from "@/lib/utils/faceMatchUtils";

const LOCALE_MAP: Record<string, string> = {
  pt: "pt-PT",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

const DEFAULT_EVENT_COVER = "/images/default-event-cover.jpg";

export default function EventGalleryPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bibNumberFilter, setBibNumberFilter] = useState<string>("");
  const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);
  const [faceInputMode, setFaceInputMode] = useState<"camera" | "upload">(
    "camera"
  );
  const [faceMatches, setFaceMatches] = useState<any[]>([]);
  const [facePhotos, setFacePhotos] = useState<any[] | null>(null);
  const [groupedMatches, setGroupedMatches] = useState<any[]>([]);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    new Set()
  );
  const [isLoadingFace, setIsLoadingFace] = useState(false);
  const [buyingAll, setBuyingAll] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );
  const [faceFilterAge, setFaceFilterAge] = useState<string>("");
  const [faceFilterGender, setFaceFilterGender] = useState<string>("");

  const router = useRouter();
  const { addItems, applyCoupon } = useCart();
  const { t, locale } = useTranslation();

  // Pacote: adiciona todas as fotos do evento ao carrinho + aplica PACOTE20.
  const handleBuyAllEvent = async () => {
    if (!event?.photos?.length) return;
    setBuyingAll(true);
    try {
      const cartItems = event.photos.map((p: any) => ({
        id: p.id,
        photoId: p.id,
        name: p.name,
        price: p.price,
        eventId: event.id,
        eventTitle: event.title,
        photographerId: p.photographer?.id || "",
        photographerName: p.photographer?.user?.name || "Fotógrafo",
      }));
      addItems(cartItems); // bulk: um único setState (sem stale closure)

      const subtotal = cartItems.reduce(
        (sum: number, i: any) => sum + (i.price || 0),
        0
      );

      // Auto-aplica o cupom de pacote
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "PACOTE20", subtotal }),
      });
      const data = await res.json();
      if (data.valid) applyCoupon(data.coupon);

      router.push("/cart");
    } finally {
      setBuyingAll(false);
    }
  };

  // Group matches by cluster, deduplicate, show best + count badge + expand
  const handleFaceMatch = (matches: any[]) => {
    setFaceMatches(matches);
    setExpandedClusters(new Set()); // Reset expanded state
    if (!event?.photos) {
      setFacePhotos([]);
      setGroupedMatches([]);
      return;
    }
    const byId = new Map(event.photos.map((p: any) => [p.id, p]));

    // Enrich matches with photo data
    const enriched = matches.map((m, idx) => {
      const photo = byId.get(m.photoId);
      const percentile = ((matches.length - idx) / matches.length) * 100;
      return photo
        ? {
            ...photo,
            matchPercent: m.matchPercent,
            matchPercentile: Math.round(percentile),
            faceClusterId: m.faceClusterId,
          }
        : null;
    }).filter(Boolean);

    // Group by cluster
    const grouped = groupMatchesByCluster(enriched);
    setGroupedMatches(grouped);

    // Display only best match per group (unless expanded)
    const displayed = grouped.map((g) => ({
      ...g.bestMatch,
      clusterCount: g.count,
      clusterId: g.groupId,
    }));
    setFacePhotos(displayed);
  };

  // Toggle cluster expansion
  const toggleClusterExpand = (clusterId: string) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(clusterId)) {
      newExpanded.delete(clusterId);
    } else {
      newExpanded.add(clusterId);
    }
    setExpandedClusters(newExpanded);

    // Rebuild display including expanded groups
    if (!facePhotos) return;
    const displayed: any[] = [];
    for (const group of groupedMatches) {
      if (newExpanded.has(group.groupId)) {
        // Show all matches in this cluster
        for (const m of group.allMatches) {
          displayed.push({
            ...m,
            clusterCount: group.count,
            clusterId: group.groupId,
            isClusterVariation: true,
          });
        }
      } else {
        // Show best only
        displayed.push({
          ...group.bestMatch,
          clusterCount: group.count,
          clusterId: group.groupId,
        });
      }
    }
    setFacePhotos(displayed);
  };

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const { eventId } = await params;
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) throw new Error("Event not found");

        const { event, stats } = await res.json();
        // Public gallery only shows approved events. Pending/rejected/archived
        // stay invisible to the public (owner/admin manage them via dashboard).
        if (!event || event.status !== "active") {
          throw new Error("Event not found");
        }
        setEvent(event);
        setStats(stats);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load event"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [params]);

  useEffect(() => {
    if (!event?.photos) return;

    let filtered = [...event.photos];

    // Bib number filter
    if (bibNumberFilter) {
      filtered = filtered.filter((photo: any) => {
        if (!photo.detectedBibNumbers) return false;
        try {
          const numbers = JSON.parse(photo.detectedBibNumbers);
          return numbers.some((n: any) =>
            n.number.includes(bibNumberFilter)
          );
        } catch {
          return photo.detectedBibNumbers.includes(bibNumberFilter);
        }
      });
    }

    // Price filter (all photos in event have same price, so filter by event price)
    if (minPrice !== undefined || maxPrice !== undefined) {
      const eventPrice = event?.priceEUR || 0;
      if (
        (minPrice !== undefined && eventPrice < minPrice) ||
        (maxPrice !== undefined && eventPrice > maxPrice)
      ) {
        filtered = [];
      }
    }

    // Sort by price (note: all photos in event have same price, so order doesn't change)
    if (sortBy === "price-asc" || sortBy === "price-desc") {
      // Price is uniform within event, so sort is a no-op
      // Keep for UX consistency but doesn't affect results
    }

    setFilteredPhotos(filtered);
  }, [bibNumberFilter, minPrice, maxPrice, sortBy, event?.photos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("event.notFound.title")}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/photos"
            className="inline-block px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b]"
          >
            {t("event.back")}
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);

  return (
    <div>
      {/* Header with Banner */}
      <div className="relative h-64 bg-gradient-to-r from-blue-400 to-blue-600 overflow-hidden">
        {(() => {
          const uploadedCover = event.photos?.find(
            (p: any) =>
              typeof p?.key === "string" && p.key.startsWith("uploads/")
          );
          const coverUrl = uploadedCover
            ? `/${uploadedCover.key}`
            : event.banner && !event.banner.includes("placeholder")
            ? event.banner
            : DEFAULT_EVENT_COVER;
          return coverUrl ? (
            <Image
              src={coverUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white text-8xl">
              📸
            </div>
          );
        })()}

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto px-4 w-full pb-8 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                {(() => {
                  const cat = EVENT_CATEGORIES.find((c) => c.value === event.sport);
                  return cat ? t(cat.labelKey) : event.sport;
                })()}
              </span>
              <span className="text-sm opacity-90">
                {eventDate.toLocaleDateString(LOCALE_MAP[locale] || "pt-PT", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
            {event.location && (
              <p className="text-[#e8f0ff] flex items-center gap-2">
                <span>📍</span>
                {event.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-8 text-sm">
            <div>
              <div className="font-bold text-lg text-gray-900">
                {stats?.photoCount || 0}
              </div>
              <div className="text-gray-600">{t("downloads.photos")}</div>
            </div>
            <div>
              <div className="font-bold text-lg text-gray-900">
                {stats?.photographerCount || 0}
              </div>
              <div className="text-gray-600">{t("event.photographers")}</div>
            </div>
            {event.location && (
              <div>
                <div className="font-bold text-lg text-gray-900">
                  {event.location.split(",")[0]}
                </div>
                <div className="text-gray-600">{t("event.location")}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>
        </div>
      )}

      {/* Gallery */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Busca dupla em destaque (rosto + dorsal lado a lado, sem abas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Por rosto */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              🔍 {t("event.face.title")}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t("event.face.desc")}{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
                Busca facial ativa
              </span>
            </p>

            {/* Toggle câmera / upload */}
            <div className="inline-flex rounded-lg border border-gray-300 p-1 mb-4">
              <button
                onClick={() => {
                  setFaceInputMode("camera");
                  setFaceMatches([]);
                  setFacePhotos(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                  faceInputMode === "camera"
                    ? "bg-[#09419b] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📷 {t("event.face.live")}
              </button>
              <button
                onClick={() => {
                  setFaceInputMode("upload");
                  setFaceMatches([]);
                  setFacePhotos(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                  faceInputMode === "upload"
                    ? "bg-[#09419b] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🖼️ {t("event.face.upload")}
              </button>
            </div>

            {/* Demographic Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {t("face.filter.demographics")}
              </h3>
              <div className="space-y-3">
                {/* Age Range */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Ex: 20-35"
                    value={faceFilterAge}
                    onChange={(e) => setFaceFilterAge(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#09419b]"
                  />
                  <label className="text-xs text-gray-600 flex-1">
                    {t("face.filter.ageRange")}
                  </label>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs text-gray-600 block mb-2">
                    {t("face.filter.gender")}
                  </label>
                  <div className="flex gap-3">
                    {["Male", "Female"].map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={faceFilterGender === g}
                          onChange={(e) =>
                            setFaceFilterGender(e.target.checked ? g : "")
                          }
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{t(`face.gender.${g.toLowerCase()}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {faceInputMode === "camera" ? (
              <FaceCameraSearch
                eventId={event.id}
                onMatch={handleFaceMatch}
                onLoading={setIsLoadingFace}
                filterAge={faceFilterAge}
                filterGender={faceFilterGender}
              />
            ) : (
              <SelfieUpload
                eventId={event.id}
                onMatch={handleFaceMatch}
                onLoading={setIsLoadingFace}
                filterAge={faceFilterAge}
                filterGender={faceFilterGender}
              />
            )}
          </div>

          {/* Por dorsal/peito */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              #️⃣ {t("event.bib.title")}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t("event.bib.desc")}
            </p>
            <BibNumberSearch
              eventId={event.id}
              onSearch={(bibNumber) => setBibNumberFilter(bibNumber)}
            />
          </div>
        </div>

        {/* Resultados da busca por rosto (destacados acima da galeria) */}
        {!isLoadingFace && facePhotos !== null && (
          <div className="mb-10">
            {facePhotos.length > 0 ? (
              <>
                <div className="mb-4 p-3 bg-[#fef7e8] rounded-lg">
                  <p className="text-sm text-green-800">
                    {facePhotos.length}{" "}
                    {facePhotos.length !== 1 ? t("facematch.photos") : t("facematch.photo")}{" "}
                    {t("event.face.forThisFace")}
                    {faceMatches[0]?.matchPercent
                      ? ` · ${t("event.face.bestMatch")} ${faceMatches[0].matchPercent}%`
                      : ""}
                  </p>
                </div>
                <PhotoGrid
                  photos={facePhotos}
                  eventId={event.id}
                  event={event}
                  isLoading={false}
                  onClusterClick={toggleClusterExpand}
                />
              </>
            ) : (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-gray-700 font-medium">
                  {t("event.face.noResult")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pacote: todas as fotos do evento com desconto */}
        {!bibNumberFilter && event.photos?.length > 0 && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg">
                🎁 {t("event.bundle.title")}
              </p>
              <p className="text-sm text-white/90">
                {event.photos.length} {t("grid.photos")} · {t("event.bundle.discount")}
              </p>
            </div>
            <button
              onClick={handleBuyAllEvent}
              disabled={buyingAll}
              className="px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-60 whitespace-nowrap"
            >
              {buyingAll ? t("event.bundle.adding") : t("event.bundle.add")}
            </button>
          </div>
        )}

        {/* Galeria completa (sempre visível) */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {bibNumberFilter
            ? `${t("event.gallery.bibTitle")} #${bibNumberFilter}`
            : t("event.gallery.allTitle")}
        </h2>

        {bibNumberFilter && (
          <div className="mb-4 p-3 bg-[#e8f0ff] rounded-lg flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {t("grid.showing")} {filteredPhotos.length} {t("grid.photos")}{" "}
              {t("event.gallery.forBib")} #{bibNumberFilter}
            </p>
            <button
              onClick={() => setBibNumberFilter("")}
              className="text-sm text-[#09419b] underline hover:text-blue-900"
            >
              {t("bib.clear")}
            </button>
          </div>
        )}

        {/* Filtros de preço */}
        <div className="mb-8">
          <PriceFilter
            onPriceChange={(min, max) => {
              setMinPrice(min);
              setMaxPrice(max);
            }}
            onSortChange={setSortBy}
          />
        </div>

        {/* Resultado da filtragem */}
        {(minPrice !== undefined || maxPrice !== undefined) && (
          <div className="mb-4 p-3 bg-[#fef7e8] rounded-lg flex items-center justify-between">
            <p className="text-sm text-gray-800">
              {t("grid.showing")} {filteredPhotos.length} {t("grid.photos")}
              {minPrice !== undefined && maxPrice !== undefined
                ? ` entre €${minPrice} e €${maxPrice}`
                : minPrice !== undefined
                  ? ` a partir de €${minPrice}`
                  : ` até €${maxPrice}`}
            </p>
            <button
              onClick={() => {
                setMinPrice(undefined);
                setMaxPrice(undefined);
              }}
              className="text-sm text-[#09419b] underline hover:text-blue-900"
            >
              {t("bib.clear")}
            </button>
          </div>
        )}

        <PhotoGrid
          photos={filteredPhotos}
          eventId={event.id}
          event={event}
          isLoading={loading}
        />
      </div>

      {/* Back Link */}
      <div className="max-w-7xl mx-auto px-4 py-6 border-t border-gray-200">
        <Link
          href="/photos"
          className="text-[#09419b] hover:text-[#09419b] font-semibold flex items-center gap-2"
        >
          ← {t("event.back")}
        </Link>
      </div>
    </div>
  );
}
