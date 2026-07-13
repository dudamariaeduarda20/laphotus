"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Photo {
  id: string;
  name: string;
  key: string;
  thumbnailKey: string | null;
  price: number;
  width: number | null;
  height: number | null;
}

interface Props {
  orderId: string;
  photos: Photo[];
  expiresAt: Date;
}

export default function DownloadClient({
  orderId,
  photos,
  expiresAt,
}: Props) {
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(
    null
  );

  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    try {
      const response = await fetch("/api/download/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
        return;
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `order-${orderId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("ZIP download error:", error);
      alert("Erro ao gerar ZIP");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleDownloadPhoto = async (photoId: string) => {
    setDownloadingPhotoId(photoId);
    try {
      // Get signed URL from server (secure)
      const response = await fetch(
        `/api/download/photo?photoId=${photoId}&orderId=${orderId}`
      );

      if (!response.ok) {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
        return;
      }

      const { url } = await response.json();

      // Download directly
      window.location.href = url;
    } catch (error) {
      console.error("Photo download error:", error);
      alert("Erro ao baixar foto");
    } finally {
      setDownloadingPhotoId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Download Section */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Baixar Tudo (ZIP)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Baixe todas as {photos.length} fotos em um arquivo ZIP comprimido
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Link disponível até{" "}
              {expiresAt.toLocaleDateString("pt-BR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={handleDownloadZip}
            disabled={isGeneratingZip}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-slate-400"
          >
            {isGeneratingZip ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Baixar ZIP
              </>
            )}
          </button>
        </div>
      </div>

      {/* Individual Photos */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Fotos Individuais
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              {photo.thumbnailKey ? (
                <div className="relative aspect-square overflow-hidden rounded-t-lg bg-slate-100">
                  <img
                    src={`https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${photo.thumbnailKey}`}
                    alt={photo.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-t-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <span className="text-sm text-slate-500">No thumbnail</span>
                </div>
              )}

              {/* Info */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="font-medium text-slate-900 line-clamp-2">
                    {photo.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {photo.width && photo.height
                      ? `${photo.width}×${photo.height}px`
                      : "Dimensões desconhecidas"}
                  </p>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => handleDownloadPhoto(photo.id)}
                  disabled={downloadingPhotoId === photo.id}
                  className="mt-4 flex items-center justify-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:bg-slate-300"
                >
                  {downloadingPhotoId === photo.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Baixar
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-xs text-slate-600">
          Seus links expiram em 24 horas. Após isso, você precisará fazer um
          novo pedido.
        </p>
      </div>
    </div>
  );
}
