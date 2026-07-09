"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sourcing Brief — Camera Body Overlay
 * Subject: Sony-style mirrorless camera back, viewfinder screen cut out (transparent)
 * Lighting: studio product shot, flat/even
 * Aspect ratio: 1280x1169 (near-square, portrait-leaning)
 * Special styling: none — PNG has a true alpha hole where the LCD screen sits,
 * so any layer placed beneath it shows through exactly in that rectangle.
 */
const CAMERA_ASSET = "/images/camera-mockup.png";
const CAMERA_NATURAL_WIDTH = 1280;
const CAMERA_NATURAL_HEIGHT = 1169;

// Viewfinder (transparent screen) bounding box, measured from the PNG's alpha
// channel as % of the full image. Nudge these if the asset is swapped.
const VIEWFINDER = {
  left: 0.1766,
  top: 0.4303,
  right: 0.6133,
  bottom: 0.7725,
};
const VF_WIDTH_PCT = VIEWFINDER.right - VIEWFINDER.left;
const VF_HEIGHT_PCT = VIEWFINDER.bottom - VIEWFINDER.top;

const MAX_ZOOM_MULT = 4;

interface Transform {
  scale: number;
  x: number; // translateX in px, relative to viewfinder box top-left
  y: number; // translateY in px, relative to viewfinder box top-left
}

interface CameraMockupProps {
  className?: string;
  /** Event ID — if provided, mockup will be uploaded to API. If not, only downloads locally. */
  eventId?: string;
  /** Only admins can upload/drag/zoom/save. Everyone else sees a read-only camera. */
  isAdmin?: boolean;
  /** Called with the final composited PNG data URL when the user saves. */
  onSave?: (dataUrl: string) => void;
}

export default function CameraMockup({ className, eventId, isAdmin = false, onSave }: CameraMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const dragStateRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });
  const pinchStateRef = useRef({ startDist: 0, startScale: 1 });

  // Track container size for px<->natural-resolution conversion
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const renderScale = containerWidth ? containerWidth / CAMERA_NATURAL_WIDTH : 0;
  const vfBoxPx = {
    w: CAMERA_NATURAL_WIDTH * VF_WIDTH_PCT * renderScale,
    h: CAMERA_NATURAL_HEIGHT * VF_HEIGHT_PCT * renderScale,
  };

  const minScaleFor = useCallback(
    (natW: number, natH: number) => {
      if (!vfBoxPx.w || !vfBoxPx.h || !natW || !natH) return 1;
      // "cover" baseline: smallest scale where photo still fills the viewfinder box
      return Math.max(vfBoxPx.w / natW, vfBoxPx.h / natH);
    },
    [vfBoxPx.w, vfBoxPx.h]
  );

  const clamp = useCallback(
    (t: Transform, natW: number, natH: number): Transform => {
      const min = minScaleFor(natW, natH);
      const scale = Math.min(Math.max(t.scale, min), min * MAX_ZOOM_MULT);
      const dispW = natW * scale;
      const dispH = natH * scale;
      const minX = vfBoxPx.w - dispW; // <= 0
      const minY = vfBoxPx.h - dispH; // <= 0
      const x = Math.min(Math.max(t.x, minX), 0);
      const y = Math.min(Math.max(t.y, minY), 0);
      return { scale, x, y };
    },
    [minScaleFor, vfBoxPx.w, vfBoxPx.h]
  );

  const centerTransform = useCallback(
    (scale: number, natW: number, natH: number): Transform => {
      const dispW = natW * scale;
      const dispH = natH * scale;
      return { scale, x: (vfBoxPx.w - dispW) / 2, y: (vfBoxPx.h - dispH) / 2 };
    },
    [vfBoxPx.w, vfBoxPx.h]
  );

  const handleFile = (file: File) => {
    if (!isAdmin) return;
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      const min = minScaleFor(img.naturalWidth, img.naturalHeight);
      setTransform(centerTransform(min, img.naturalWidth, img.naturalHeight));
      setPhotoSrc(url);
    };
    img.src = url;
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ---- Drag (pan) ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (!isAdmin || !photoSrc) return;
    setIsDragging(true);
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: transform.x,
      origY: transform.y,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !photoSrc) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    setTransform((prev) =>
      clamp(
        { ...prev, x: dragStateRef.current.origX + dx, y: dragStateRef.current.origY + dy },
        naturalSize.w,
        naturalSize.h
      )
    );
  };

  const onPointerUp = () => setIsDragging(false);

  // ---- Zoom (wheel) ----
  const onWheel = (e: React.WheelEvent) => {
    if (!isAdmin || !photoSrc) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setTransform((prev) => {
      const nextScale = prev.scale * (1 + delta);
      // Zoom centered on viewfinder middle
      const cx = vfBoxPx.w / 2;
      const cy = vfBoxPx.h / 2;
      const ratio = nextScale / prev.scale;
      const nx = cx - (cx - prev.x) * ratio;
      const ny = cy - (cy - prev.y) * ratio;
      return clamp({ scale: nextScale, x: nx, y: ny }, naturalSize.w, naturalSize.h);
    });
  };

  // ---- Pinch zoom (touch) ----
  const onTouchStart = (e: React.TouchEvent) => {
    if (!isAdmin) return;
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStateRef.current = { startDist: dist, startScale: transform.scale };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isAdmin && e.touches.length === 2 && photoSrc) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = dist / (pinchStateRef.current.startDist || dist);
      const nextScale = pinchStateRef.current.startScale * ratio;
      setTransform((prev) => clamp({ ...prev, scale: nextScale }, naturalSize.w, naturalSize.h));
    }
  };

  const handleCenter = () => {
    if (!isAdmin || !photoSrc) return;
    setTransform((prev) => centerTransform(prev.scale, naturalSize.w, naturalSize.h));
  };

  const handleClear = () => {
    if (!isAdmin) return;
    setPhotoSrc(null);
    setNaturalSize({ w: 0, h: 0 });
    setTransform({ scale: 1, x: 0, y: 0 });
  };

  const handleSave = async () => {
    if (!isAdmin || !photoSrc || !containerWidth) return;
    setIsSaving(true);
    try {
      // Export at native camera-asset resolution for crisp output.
      const canvas = document.createElement("canvas");
      canvas.width = CAMERA_NATURAL_WIDTH;
      canvas.height = CAMERA_NATURAL_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const naturalScaleFactor = CAMERA_NATURAL_WIDTH / containerWidth;
      const vfBoxNative = {
        x: CAMERA_NATURAL_WIDTH * VIEWFINDER.left,
        y: CAMERA_NATURAL_HEIGHT * VIEWFINDER.top,
        w: CAMERA_NATURAL_WIDTH * VF_WIDTH_PCT,
        h: CAMERA_NATURAL_HEIGHT * VF_HEIGHT_PCT,
      };

      const photoImg = new Image();
      photoImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        photoImg.onload = () => resolve();
        photoImg.onerror = reject;
        photoImg.src = photoSrc;
      });

      // Clip to viewfinder box, then draw photo with current pan/zoom (scaled to native res)
      ctx.save();
      ctx.beginPath();
      ctx.rect(vfBoxNative.x, vfBoxNative.y, vfBoxNative.w, vfBoxNative.h);
      ctx.clip();

      const dispW = naturalSize.w * transform.scale * naturalScaleFactor;
      const dispH = naturalSize.h * transform.scale * naturalScaleFactor;
      const dx = vfBoxNative.x + transform.x * naturalScaleFactor;
      const dy = vfBoxNative.y + transform.y * naturalScaleFactor;
      ctx.drawImage(photoImg, dx, dy, dispW, dispH);
      ctx.restore();

      // Camera frame on top
      const cameraImg = new Image();
      await new Promise<void>((resolve, reject) => {
        cameraImg.onload = () => resolve();
        cameraImg.onerror = reject;
        cameraImg.src = CAMERA_ASSET;
      });
      ctx.drawImage(cameraImg, 0, 0, CAMERA_NATURAL_WIDTH, CAMERA_NATURAL_HEIGHT);

      const dataUrl = canvas.toDataURL("image/png");

      // If eventId provided, upload to API; otherwise, download locally
      if (eventId) {
        const response = await fetch(`/api/events/${eventId}/mockup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Upload failed");
        }

        const result = await response.json();
        onSave?.(result.mockupImageUrl);
      } else {
        // Download locally (demo mode)
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "laphotus-camera-mockup.png";
        link.click();
        onSave?.(dataUrl);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-md select-none"
        style={{ aspectRatio: `${CAMERA_NATURAL_WIDTH} / ${CAMERA_NATURAL_HEIGHT}` }}
      >
        {/* Viewfinder layer (photo) — sits beneath the camera frame, clipped */}
        <div
          ref={viewfinderRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => isAdmin && !photoSrc && fileInputRef.current?.click()}
          className="absolute overflow-hidden bg-[#0a0a0a] touch-none"
          style={{
            left: `${VIEWFINDER.left * 100}%`,
            top: `${VIEWFINDER.top * 100}%`,
            width: `${VF_WIDTH_PCT * 100}%`,
            height: `${VF_HEIGHT_PCT * 100}%`,
            cursor: !isAdmin ? "default" : photoSrc ? (isDragging ? "grabbing" : "grab") : "pointer",
          }}
        >
          {photoSrc ? (
            <img
              ref={imgRef}
              src={photoSrc}
              alt="Foto carregada"
              draggable={false}
              className={isDragging ? "" : "transition-transform duration-150 ease-out"}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: naturalSize.w * transform.scale,
                height: naturalSize.h * transform.scale,
                transform: `translate(${transform.x}px, ${transform.y}px)`,
                maxWidth: "none",
              }}
            />
          ) : (
            <div className="h-full w-full bg-white/10" />
          )}
        </div>

        {/* Camera frame overlay — transparent hole reveals the viewfinder layer above */}
        <img
          src={CAMERA_ASSET}
          alt="Câmera LAPHOTUS"
          draggable={false}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        />
      </div>

      {isAdmin && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-[#ff2f92] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {photoSrc ? "Trocar foto" : "Enviar foto"}
            </button>
            <button
              type="button"
              onClick={handleCenter}
              disabled={!photoSrc}
              className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Centralizar
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!photoSrc}
              className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!photoSrc || isSaving}
              className="rounded-full bg-[#f0bf38] px-5 py-2 text-sm font-semibold text-[#1a1a1a] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving ? "A gerar..." : "Salvar mockup"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
