"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

interface ImageCropperModalProps {
  file: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({
  file,
  onCropComplete,
  onCancel,
}: ImageCropperModalProps) {
  const [imageSrc] = useState(URL.createObjectURL(file));
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropAreaChange = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      const img = new Image();
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Fall back to the full image if no crop area was registered yet
      // (e.g. user clicked Apply before interacting with the cropper).
      const area = croppedAreaPixels ?? {
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      };

      const canvas = document.createElement("canvas");
      canvas.width = area.width;
      canvas.height = area.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        area.width,
        area.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
        setIsProcessing(false);
      }, "image/jpeg", 0.95);
    } catch (error) {
      console.error("Crop failed:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Ajustar Imagem do Banner
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Redimensione (16:9) e posicione a imagem
          </p>
        </div>

        <div className="relative bg-gray-100 h-96">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onCropAreaChange={onCropAreaChange}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 border-t border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="text-xs text-gray-500">
            Arraste a imagem para reposicionar. Use o zoom para ajustar.
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={isProcessing}
              className="px-4 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#0a2d6b] disabled:opacity-50"
            >
              {isProcessing ? "Processando..." : "Aplicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
