"use client";

import { useState } from "react";
import { Photo } from "@prisma/client";
import { Download, Loader2 } from "lucide-react";

interface PhotoGridItemProps {
  photo: Photo;
  price: number;
  orderId: string;
  onPhotoClick: () => void;
}

export default function PhotoGridItem({
  photo,
  price,
  orderId,
  onPhotoClick,
}: PhotoGridItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const response = await fetch(
        `/api/download/photo?photoId=${photo.id}&orderId=${orderId}`
      );

      if (!response.ok) {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
        return;
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Download error:", error);
      alert("Erro ao baixar foto");
    } finally {
      setIsDownloading(false);
    }
  };

  const thumbnailUrl = photo.thumbnailKey
    ? `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${photo.thumbnailKey}`
    : null;

  return (
    <div
      onClick={onPhotoClick}
      className="group cursor-pointer rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-slate-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={photo.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-slate-500">No thumbnail</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-slate-900 line-clamp-2 group-hover:text-blue-600">
          {photo.name}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {photo.width && photo.height
            ? `${photo.width}×${photo.height}px`
            : "Dimensões desconhecidas"}
        </p>

        {/* Price */}
        <div className="mt-3 flex items-end justify-between">
          <span className="text-lg font-bold text-slate-900">
            €{price.toFixed(2)}
          </span>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:bg-slate-300"
          >
            {isDownloading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
