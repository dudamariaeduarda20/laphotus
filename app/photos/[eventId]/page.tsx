"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PhotoGrid from "@/components/PhotoGrid";
import BibNumberSearch from "@/components/BibNumberSearch";
import SelfieUpload from "@/components/SelfieUpload";
import FaceCameraSearch from "@/components/FaceCameraSearch";

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
  // Fotos completas correspondentes ao rosto (null = ainda não pesquisou)
  const [facePhotos, setFacePhotos] = useState<any[] | null>(null);
  const [isLoadingFace, setIsLoadingFace] = useState(false);

  // Converte matches (shape leve do search-face) em objetos foto completos
  // da galeria, preservando a ordem por similaridade.
  const handleFaceMatch = (matches: any[]) => {
    setFaceMatches(matches);
    if (!event?.photos) {
      setFacePhotos([]);
      return;
    }
    const byId = new Map(event.photos.map((p: any) => [p.id, p]));
    const ordered = matches
      .map((m) => {
        const photo = byId.get(m.photoId);
        return photo ? { ...photo, matchPercent: m.matchPercent } : null;
      })
      .filter(Boolean);
    setFacePhotos(ordered);
  };

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const { eventId } = await params;
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) throw new Error("Event not found");

        const { event, stats } = await res.json();
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
  }, []);

  useEffect(() => {
    if (!event?.photos) return;

    if (!bibNumberFilter) {
      setFilteredPhotos(event.photos);
      return;
    }

    const filtered = event.photos.filter((photo: any) => {
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

    setFilteredPhotos(filtered);
  }, [bibNumberFilter, event?.photos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            Evento não encontrado
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/photos"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar aos Eventos
          </a>
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
            : null;
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
                {event.sport}
              </span>
              <span className="text-sm opacity-90">
                {eventDate.toLocaleDateString("pt-PT", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
            {event.location && (
              <p className="text-blue-100 flex items-center gap-2">
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
              <div className="text-gray-600">Fotos</div>
            </div>
            <div>
              <div className="font-bold text-lg text-gray-900">
                {stats?.photographerCount || 0}
              </div>
              <div className="text-gray-600">Fotógrafos</div>
            </div>
            {event.location && (
              <div>
                <div className="font-bold text-lg text-gray-900">
                  {event.location.split(",")[0]}
                </div>
                <div className="text-gray-600">Localização</div>
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
              🔍 Encontre-se por rosto
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Use a câmera ou carregue uma selfie. Motor:{" "}
              <span className="font-semibold">InsightFace + pgvector</span>.
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
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📷 Câmera ao vivo
              </button>
              <button
                onClick={() => {
                  setFaceInputMode("upload");
                  setFaceMatches([]);
                  setFacePhotos(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                  faceInputMode === "upload"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🖼️ Carregar selfie
              </button>
            </div>

            {faceInputMode === "camera" ? (
              <FaceCameraSearch
                eventId={event.id}
                onMatch={handleFaceMatch}
                onLoading={setIsLoadingFace}
              />
            ) : (
              <SelfieUpload
                eventId={event.id}
                onMatch={handleFaceMatch}
                onLoading={setIsLoadingFace}
              />
            )}
          </div>

          {/* Por dorsal/peito */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              #️⃣ Encontre-se por dorsal
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Digite o número do peito/dorsal que usou no evento.
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
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    {facePhotos.length} foto
                    {facePhotos.length !== 1 ? "s" : ""} encontrada
                    {facePhotos.length !== 1 ? "s" : ""} para este rosto
                    {faceMatches[0]?.matchPercent
                      ? ` · melhor correspondência ${faceMatches[0].matchPercent}%`
                      : ""}
                  </p>
                </div>
                <PhotoGrid
                  photos={facePhotos}
                  eventId={event.id}
                  event={event}
                  isLoading={false}
                />
              </>
            ) : (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-gray-700 font-medium">
                  Nenhuma foto encontrada para este rosto neste evento.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Galeria completa (sempre visível) */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {bibNumberFilter
            ? `Fotos do dorsal #${bibNumberFilter}`
            : "Todas as fotos do evento"}
        </h2>

        {bibNumberFilter && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <p className="text-sm text-blue-800">
              Mostrando {filteredPhotos.length} foto
              {filteredPhotos.length !== 1 ? "s" : ""} para dorsal #
              {bibNumberFilter}
            </p>
            <button
              onClick={() => setBibNumberFilter("")}
              className="text-sm text-blue-700 underline hover:text-blue-900"
            >
              Limpar
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
        <a
          href="/photos"
          className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
        >
          ← Voltar aos Eventos
        </a>
      </div>
    </div>
  );
}
