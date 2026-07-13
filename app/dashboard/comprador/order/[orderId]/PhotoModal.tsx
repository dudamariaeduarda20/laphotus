"use client";

import { Photo } from "@prisma/client";
import { X } from "lucide-react";

interface PhotoModalProps {
  photo: Photo;
  orderId: string;
  onClose: () => void;
}

export default function PhotoModal({
  photo,
  orderId,
  onClose,
}: PhotoModalProps) {
  const photoUrl = photo.key
    ? `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${photo.key}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] max-w-4xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -right-10 top-0 rounded-full bg-white p-2 text-slate-900 hover:bg-slate-100 sm:-right-12"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Image Container */}
        <div className="rounded-lg bg-white overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={photo.name}
              className="max-h-[80vh] w-auto"
            />
          ) : (
            <div className="flex h-96 items-center justify-center bg-slate-100">
              <span className="text-slate-500">Imagem não disponível</span>
            </div>
          )}

          {/* Info */}
          <div className="border-t border-slate-200 p-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {photo.name}
            </h3>
            {photo.width && photo.height && (
              <p className="mt-2 text-sm text-slate-600">
                Resolução: {photo.width}×{photo.height}px
              </p>
            )}
            {photo.fileSize && (
              <p className="text-sm text-slate-600">
                Tamanho: {(photo.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
