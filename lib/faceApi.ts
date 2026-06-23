"use client";

/**
 * Client-side real face recognition via face-api.js (@vladmandic/face-api).
 *
 * Runs entirely in the browser using TensorFlow.js. Models live in
 * /public/models. We extract a real 128-dimension descriptor from the user's
 * actual face — the same vector used for euclidean-distance matching on the
 * server.
 */

// face-api is loaded lazily so its heavy tfjs bundle never hits the server.
let faceapi: typeof import("@vladmandic/face-api") | null = null;
let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

const MODEL_URL = "/models";

/**
 * Loads detector + landmarks + recognition models once (idempotent).
 */
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    if (!faceapi) {
      faceapi = await import("@vladmandic/face-api");
    }
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  return loadingPromise;
}

/**
 * Extracts a real 128-dim face descriptor from an image File.
 * Returns null if no face is detected.
 */
export async function getFaceDescriptor(
  file: File
): Promise<number[] | null> {
  await loadFaceModels();
  if (!faceapi) throw new Error("face-api não carregou");

  const img = await fileToImage(file);

  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  // Release object URL
  URL.revokeObjectURL(img.src);

  if (!detection) return null;
  return Array.from(detection.descriptor);
}

/**
 * Loads a File into an HTMLImageElement for face-api processing.
 */
function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
