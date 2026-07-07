import Link from "next/link";
import Image from "next/image";
import { getPhotoImageUrl } from "@/lib/photoUrl";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { useTranslation } from "@/lib/hooks/useTranslation";

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

  // Capa: 1ª foto carregada (key uploads/) > banner real > emoji
  const uploadedCover = event.photos?.find((p: any) =>
    typeof p?.key === "string" && p.key.startsWith("uploads/")
  );
  const coverUrl = uploadedCover
    ? getPhotoImageUrl(uploadedCover.key, event.title)
    : event.banner && !event.banner.includes("placeholder")
    ? event.banner
    : null;

  return (
    <Link href={`/photos/${event.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
        {/* Banner */}
        <div className="relative h-40 bg-gradient-to-r from-blue-400 to-blue-600">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white text-4xl">
              📸
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className="px-3 py-1 bg-white/90 text-xs font-bold text-blue-600 rounded-full">
              {sportLabel ? t(sportLabel.labelKey) : event.sport}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">
            {event.title}
          </h3>

          {/* Details */}
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>
                {eventDate.toLocaleDateString(LOCALE_MAP[locale] || "pt-PT", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {isUpcoming && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {t("eventCard.upcoming")}
                </span>
              )}
            </div>

            {event.location && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span>📸</span>
              <span>{photoCount} {t("eventCard.photos")}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 border-t border-gray-200">
            <button className="w-full text-center text-blue-600 font-semibold hover:text-blue-700">
              {t("eventCard.viewGallery")}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
