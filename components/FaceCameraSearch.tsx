"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface FaceCameraSearchProps {
  eventId: string;
  onMatch?: (matches: Array<{ photoId: string }>) => void;
  onLoading?: (loading: boolean) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceDetector = any;

/**
 * Câmera ao vivo com deteção de rosto em tempo real (MediaPipe FaceDetector).
 *
 * - getUserMedia -> <video>
 * - MediaPipe deteta o rosto a cada frame e desenha um retângulo de feedback
 * - "Buscar" captura o frame atual num <canvas>, converte para Blob e envia
 *   ao backend (/api/photos/search-face -> InsightFace + pgvector)
 */
export default function FaceCameraSearch({
  eventId,
  onMatch,
  onLoading,
}: FaceCameraSearchProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<FaceDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "searching" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [faceFramed, setFaceFramed] = useState(false);

  // Loop de deteção em tempo real -> desenha retângulo
  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = overlayRef.current;
    const detector = detectorRef.current;
    if (!video || !canvas || !detector) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      if (!video.videoWidth) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let framed = false;
      try {
        const result = detector.detectForVideo(video, performance.now());
        for (const det of result.detections || []) {
          const box = det.boundingBox;
          if (!box) continue;
          framed = true;
          // Retângulo de feedback
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          ctx.strokeRect(box.originX, box.originY, box.width, box.height);
          // Cantos destacados
          ctx.fillStyle = "#22c55e";
          const c = 14;
          ctx.fillRect(box.originX, box.originY, c, 3);
          ctx.fillRect(box.originX, box.originY, 3, c);
          ctx.fillRect(box.originX + box.width - c, box.originY, c, 3);
          ctx.fillRect(box.originX + box.width - 3, box.originY, 3, c);
        }
      } catch {
        // ignora frames falhados
      }
      setFaceFramed(framed);
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  }, []);

  // Arranca câmera + carrega o modelo de deteção MediaPipe
  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      // 1. Carrega MediaPipe FaceDetector (wasm + modelo via CDN)
      const { FaceDetector, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
      );
      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.5,
      });

      // 2. Abre a câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
      detectLoop();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? t("face.error.denied")
          : t("face.error.noCamera")
      );
      setStatus("error");
    }
  }, [t, detectLoop]);

  // Captura o frame atual e envia ao backend
  const search = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    setStatus("searching");
    onLoading?.(true);
    try {
      // Captura frame para canvas
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(t("face.error.canvas"));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Converte para Blob JPEG otimizado
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error(t("face.error.capture")))),
          "image/jpeg",
          0.9
        )
      );

      const formData = new FormData();
      formData.append("file", blob, "captura.jpg");
      formData.append("eventId", eventId);

      const res = await fetch("/api/photos/search-face", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("face.error.searchFail"));

      // Verifica se face-service indisponível
      if (data.unavailable) {
        setError(data.message);
        setStatus("ready");
        return;
      }

      onMatch?.(data.matches || []);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("face.error.generic"));
      setStatus("ready");
    } finally {
      onLoading?.(false);
    }
  }, [eventId, onMatch, onLoading, t]);

  // Limpeza: pára câmera + loop ao desmontar
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      detectorRef.current?.close?.();
    };
  }, []);

  const live = status === "ready" || status === "searching";

  return (
    <div className="mb-8">
      <div className="relative mx-auto max-w-md rounded-xl overflow-hidden bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          playsInline
          muted
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
        />

        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
            {status === "loading" ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
                <p className="text-sm">{t("face.loading")}</p>
              </>
            ) : status === "error" ? (
              <>
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-red-300">{error}</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">📸</div>
                <p className="font-semibold mb-1">{t("face.title")}</p>
                <p className="text-sm text-gray-300">
                  {t("face.subtitle")}
                </p>
              </>
            )}
          </div>
        )}

        {/* Indicador de enquadramento */}
        {live && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                faceFramed
                  ? "bg-green-500 text-white"
                  : "bg-yellow-500/90 text-white"
              }`}
            >
              {faceFramed ? `✓ ${t("face.framed")}` : t("face.position")}
            </span>
          </div>
        )}
      </div>

      {/* Controlos */}
      <div className="mt-4 flex justify-center gap-3">
        {!live ? (
          <button
            onClick={start}
            disabled={status === "loading"}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "loading" ? t("face.starting") : t("face.activate")}
          </button>
        ) : (
          <button
            onClick={search}
            disabled={status === "searching" || !faceFramed}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {status === "searching" ? t("face.searching") : `🔍 ${t("home.search.button")}`}
          </button>
        )}
      </div>

      {error && live && (
        <p className="mt-3 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
