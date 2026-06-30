"use client";

import { useTranslation } from "@/lib/hooks/useTranslation";

interface Match {
  photoId: string;
  photoName: string;
  matchPercent: number;
  similarity: number;
  confidence: number;
  faceData: any;
  price: number;
  isPremium: boolean;
  photographerName: string;
}

interface FaceMatchResultsProps {
  matches: Match[];
  onPhotoClick?: (photoId: string) => void;
}

export default function FaceMatchResults({
  matches,
  onPhotoClick,
}: FaceMatchResultsProps) {
  const { t } = useTranslation();
  if (matches.length === 0) {
    return (
      <div className="bg-blue-50 rounded-lg p-8 text-center border border-blue-200">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("facematch.noMatch.title")}
        </h3>
        <p className="text-gray-600">
          {t("facematch.noMatch.desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {matches.length}{" "}
          {matches.length !== 1 ? t("facematch.photos") : t("facematch.photo")}
        </h3>
        <span className="text-sm text-gray-600">
          {t("facematch.best")} {matches[0]?.matchPercent}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <div
            key={match.photoId}
            className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer"
            onClick={() => onPhotoClick?.(match.photoId)}
          >
            {/* Image Placeholder */}
            <div className="h-48 bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center text-6xl">
              📸
            </div>

            {/* Match Info */}
            <div className="p-4 space-y-3">
              {/* Match Meter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {t("facematch.match")}
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {match.matchPercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${match.matchPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Photo Info */}
              <div className="border-t border-gray-200 pt-3">
                <h4 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                  {match.photoName}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {t("facematch.by")} {match.photographerName}
                </p>

                {/* Confidence Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    {t("facematch.confidence")} {Math.round(match.confidence * 100)}%
                  </span>
                  {match.isPremium && (
                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                      Premium
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t("facematch.price")}</span>
                  <span className="font-bold text-blue-600">€ {match.price.toFixed(2)}</span>
                </div>
              </div>

              {/* Action */}
              <button className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-semibold transition">
                {t("photo.viewDetails")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Face Analysis Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">
          📊 {t("facematch.analysis")} (face-api.js · 128-D)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-600 block">{t("facematch.stat.matched")}</span>
            <span className="font-semibold text-gray-900">{matches.length}</span>
          </div>
          <div>
            <span className="text-gray-600 block">{t("facematch.stat.best")}</span>
            <span className="font-semibold text-gray-900">
              {matches[0]?.matchPercent}%
            </span>
          </div>
          <div>
            <span className="text-gray-600 block">{t("facematch.stat.avg")}</span>
            <span className="font-semibold text-gray-900">
              {Math.round(
                (matches.reduce((sum, m) => sum + m.matchPercent, 0) /
                  matches.length) *
                  10
              ) / 10}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
