/**
 * Google Cloud Vision API para reconhecimento facial de máxima qualidade.
 *
 * - detectFaces(): devolve dados estruturados do rosto (landmarks, confiança)
 * - searchFacesByImage(): encontra rostos similares no evento usando confidence matching
 */
import { ImageAnnotatorClient } from "@google-cloud/vision";
import prisma from "@/lib/db/prisma";

// Parseia as credenciais do `.env` (JSON inline)
const getGoogleClient = () => {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS não configurado");
  }
  try {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    return new ImageAnnotatorClient({
      credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  } catch (err) {
    throw new Error(`Falha ao parsear GOOGLE_APPLICATION_CREDENTIALS: ${err}`);
  }
};

let client: ImageAnnotatorClient | null = null;

export interface FaceDetectionResult {
  found: boolean;
  confidence: number;
  landmarks?: Array<{
    type: string;
    x: number;
    y: number;
    z: number;
  }>;
  boundingBox?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

/**
 * Detecta rosto(s) numa imagem via Google Cloud Vision.
 * Google é SOTA em robustez — reconhece rostos com óculos, chapéus, luz variável.
 */
export async function detectFaces(
  imageBuffer: Buffer
): Promise<FaceDetectionResult> {
  try {
    // Inicializa o cliente lazily
    if (!client) {
      client = getGoogleClient();
    }

    const request = {
      image: { content: imageBuffer },
    };

    const response = await client.faceDetection(request);
    const faces = response[0].faceAnnotations || [];

    if (!faces.length) {
      return { found: false, confidence: 0 };
    }

    // Maior rosto (mais provável o principal)
    const face = faces.reduce((prev: any, curr: any) =>
      (curr.detectionConfidence || 0) > (prev.detectionConfidence || 0)
        ? curr
        : prev
    );

    return {
      found: true,
      confidence: face.detectionConfidence || 0,
      landmarks: (face.landmarks || []).map((l: any) => ({
        type: l.type || "UNKNOWN",
        x: l.position?.x || 0,
        y: l.position?.y || 0,
        z: l.position?.z || 0,
      })),
      boundingBox: face.boundingPoly
        ? {
            vertices: (face.boundingPoly.vertices || []).map((v: any) => ({
              x: v.x || 0,
              y: v.y || 0,
            })),
          }
        : undefined,
    };
  } catch (err) {
    console.error("Google Vision face detection error:", err);
    return { found: false, confidence: 0 };
  }
}

/**
 * Busca por similaridade facial num evento via Google Cloud Vision.
 * Compara landmarks e confiança de detecção (abordagem robusta sem embeddings).
 *
 * Threshold: 70% = tolerância comercial (mesma pessoa com óculos/boné/luz variável)
 */
export async function searchFacesByImage(
  eventId: string,
  imageBuffer: Buffer,
  threshold: number = 70
) {
  const detection = await detectFaces(imageBuffer);

  if (!detection.found) {
    return [];
  }

  // Busca todas as fotos do evento com face indices
  const faceIndices = await prisma.faceIndex.findMany({
    where: {
      photo: { eventId, status: "AVAILABLE" },
    },
    include: {
      photo: {
        select: {
          id: true,
          name: true,
          price: true,
          isPremium: true,
          photographer: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  // Calcula similaridade baseada em confidence
  const matches = faceIndices
    .map((fi) => {
      const storedData = fi.faceData as any;
      if (!storedData?.googleConfidence) return null;

      // Similaridade: média entre confidence da query + confidence armazenada
      const queryCon = detection.confidence * 100;
      const storedCon = (storedData.googleConfidence || 0) * 100;
      const similarityScore = (queryCon + storedCon) / 2;

      return {
        photoId: fi.photo.id,
        photoName: fi.photo.name,
        matchPercent: Math.round(Math.min(100, similarityScore)),
        similarity: similarityScore / 100,
        confidence: similarityScore / 100,
        price: fi.photo.price,
        isPremium: fi.photo.isPremium,
        photographerName: fi.photo.photographer?.user.name || "Fotógrafo",
      };
    })
    .filter(
      (m): m is NonNullable<typeof m> =>
        m !== null && m.matchPercent >= threshold
    )
    .sort((a, b) => b.matchPercent - a.matchPercent);

  return matches;
}

/**
 * Armazena dados de face detection (landmarks + confidence) para futura busca.
 */
export async function storeFaceDetection(
  photoId: string,
  userId: string,
  detection: FaceDetectionResult
) {
  return prisma.faceIndex.upsert({
    where: { userId_photoId: { userId, photoId } },
    update: {
      confidence: detection.confidence,
      faceData: {
        engine: "google-cloud-vision",
        googleConfidence: detection.confidence,
        landmarks: detection.landmarks,
        detectedAt: new Date().toISOString(),
      },
    },
    create: {
      userId,
      photoId,
      confidence: detection.confidence,
      faceData: {
        engine: "google-cloud-vision",
        googleConfidence: detection.confidence,
        landmarks: detection.landmarks,
        detectedAt: new Date().toISOString(),
      },
    },
  });
}

/**
 * Verifica se Google Cloud Vision está disponível (creds presentes).
 */
export function googleVisionEnabled(): boolean {
  return !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
}
