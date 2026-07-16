"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface SelfieUploadProps {
  eventId: string;
  onMatch?: (matches: any[]) => void;
  onLoading?: (loading: boolean) => void;
  filterAge?: string;
  filterGender?: string;
}

export default function SelfieUpload({
  eventId,
  onMatch,
  onLoading,
  filterAge,
  filterGender,
}: SelfieUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("selfie.err.imageOnly"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t("selfie.err.maxSize"));
      return;
    }

    setIsProcessing(true);
    setError(null);
    onLoading?.(true);

    try {
      // Reconhecimento facial via InsightFace + pgvector (processado no servidor)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", eventId);
      if (filterAge) formData.append("ageRange", filterAge);
      if (filterGender) formData.append("gender", filterGender);

      const res = await fetch("/api/photos/search-face", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("selfie.err.process"));
      }

      // Verifica se face-service indisponível
      if (data.unavailable) {
        setError(data.message);
        return;
      }

      setFileName(file.name);
      onMatch?.(data.matches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("selfie.err.load"));
    } finally {
      setIsProcessing(false);
      onLoading?.(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="mb-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          isDragging
            ? "border-[#09419b] bg-[#e8f0ff]"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        {isProcessing ? (
          <div className="space-y-3">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#09419b]"></div>
            <p className="text-gray-700 font-semibold">{t("selfie.processing")}</p>
            <p className="text-sm text-gray-500">
              {t("selfie.processingDesc")}
            </p>
          </div>
        ) : fileName ? (
          <div className="space-y-2">
            <div className="text-4xl">✅</div>
            <p className="text-gray-900 font-semibold">{t("selfie.success")}</p>
            <p className="text-sm text-gray-600">{fileName}</p>
            <button
              onClick={() => {
                setFileName(null);
                setError(null);
              }}
              className="mt-3 text-[#09419b] hover:text-[#09419b] font-semibold text-sm"
            >
              {t("selfie.another")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl">📸</div>
            <div>
              <p className="text-gray-900 font-semibold">
                {t("selfie.title")}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {t("selfie.subtitle")}
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="selfie-input"
            />
            <label
              htmlFor="selfie-input"
              className="inline-block px-4 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] cursor-pointer font-semibold"
            >
              {t("selfie.select")}
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
