import Link from "next/link";
import Image from "next/image";
import { getPhotoImageUrl } from "@/lib/photoUrl";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { useTranslation } from "@/lib/hooks/useTranslation";

const DEFAULT_EVENT_COVER = "/images/default-event-cover.jpg";

const LOCALE_MAP: Record<string, string> = {
  pt: "pt-PT",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

interface EventCardProps {
  event: {
    id: string;
    title: string;
    sport: string;
    date: Date;
    location?: string | null;
    banner?: string | null;
    photos?: any[];
  };
}

export default function EventCard({ event }: EventCardProps) {
  const { t, locale } = useTranslation();
  const photoCount = event.photos?.length || 0;
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();
  const sportLabel = EVENT_CATEGORIES.find((c) => c.value === event.sport);

  // Capa: 1ª foto carregada (key uploads/) > banner real > default > emoji
  const uploadedCover = event.photos?.find((p: any) =>
    typeof p?.key === "string" && p.key.startsWith("uploads/")
  );
  const coverUrl = uploadedCover
    ? getPhotoImageUrl(uploadedCover.key, event.title)
    : event.banner && !event.banner.includes("placeholder")
    ? event.banner
    : DEFAULT_EVENT_COVER;

  return (
    <Link href={`/photos/${event.id}`}>
      <div className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer">
        {/* Image Container — Hover Effect */}
        <div className="relative h-48 bg-gradient-to-r from-[#09419b] to-[#ff2f92] overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white text-5xl">
              📸
            </div>
          )}

          {/* Sport Badge */}
          <div className="absolute top-3 right-3">
            <span className="px-4 py-2 bg-white/95 text-xs font-bold text-[#09419b] rounded-full shadow-sm">
              {sportLabel ? t(sportLabel.labelKey) : event.sport}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <div className="text-white font-semibold text-sm">
              Ver galeria →
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h3 className="font-serif font-bold text-xl text-[#09419b] line-clamp-2 leading-tight">
            {event.title}
          </h3>

          {/* Details */}
          <div className="space-y-3 text-sm text-[#666]">
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <span className="font-medium">
                {eventDate.toLocaleDateString(LOCALE_MAP[locale] || "pt-PT", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {isUpcoming && (
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                  {t("eventCard.upcoming")}
                </span>
              )}
            </div>

            {event.location && (
              <div className="flex items-center gap-2">
                <span className="text-base">📍</span>
                <span className="line-clamp-1 font-medium">{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-base">📸</span>
              <span className="font-medium">{photoCount} {t("eventCard.photos")}</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-2 border-t border-[#f0bf38]">
            <button className="w-full text-center py-2 text-[#09419b] font-semibold hover:text-[#ff2f92] hover:bg-[#f0bf38]/10 rounded transition">
              {t("eventCard.viewGallery", "Ver galeria")}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
