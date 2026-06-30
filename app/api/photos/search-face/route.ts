import { NextRequest, NextResponse } from "next/server";
import { rateLimits } from "@/lib/middleware/rateLimit";
import {
  googleVisionEnabled,
  searchFacesByImage as googleSearch,
} from "@/lib/services/googleVisionService";
import {
  embedImage,
  searchByEmbedding,
  faceServiceHealthy,
} from "@/lib/services/insightFaceService";
import { awsEnabled, searchFacesByBytes } from "@/lib/services/faceService";
import prisma from "@/lib/db/prisma";

/**
 * POST /api/photos/search-face
 *
 * Recebe um frame capturado pela câmera (multipart "file" + "eventId").
 *
 * Motor (seleção automática, ordem de prioridade):
 *   1. Google Cloud Vision (SOTA, se creds presentes)
 *   2. AWS Rekognition (se creds presentes)
 *   3. InsightFace + pgvector (default)
 */
export async function POST(request: NextRequest) {
  const limited = rateLimits.searchFace(request);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const eventId = formData.get("eventId") as string | null;

    if (!file || !eventId) {
      return NextResponse.json(
        { error: "Imagem e evento são obrigatórios" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let matches: any[] = [];
    let engine = "";

    // Debug: log engine availability
    console.log("[search-face] Engine status:", {
      googleEnabled: googleVisionEnabled(),
      googleCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      googleProject: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      awsEnabled: awsEnabled(),
      env: process.env.NODE_ENV,
    });

    // === Motor 1: Google Cloud Vision (SOTA, se creds presentes) ===
    if (googleVisionEnabled()) {
      try {
        matches = await googleSearch(eventId, buffer, 70);
        if (matches.length > 0) {
          engine = "Google Cloud Vision";
          return NextResponse.json(
            {
              matches,
              summary: {
                total: matches.length,
                bestMatch: matches[0]?.matchPercent || 0,
                engine,
              },
            },
            { status: 200 }
          );
        }
      } catch (err) {
        console.error("Google Vision error:", err);
        // fallback para próximo motor
      }
    }

    // === Motor 2: AWS Rekognition (se creds presentes) ===
    if (awsEnabled()) {
      try {
        matches = await searchFacesByBytes(eventId, buffer, 80);
        if (matches.length > 0) {
          engine = "AWS Rekognition";
          return NextResponse.json(
            {
              matches,
              summary: {
                total: matches.length,
                bestMatch: matches[0]?.matchPercent || 0,
                engine,
              },
            },
            { status: 200 }
          );
        }
      } catch (err) {
        console.error("AWS error:", err);
        // fallback para próximo motor
      }
    }

    // === Motor 3: InsightFace + pgvector (default) ===
    if (await faceServiceHealthy()) {
      try {
        // 1. Embedding via InsightFace
        const result = await embedImage(buffer, "selfie.jpg", file.type);
        if (result.found && result.embedding) {
          // 2. Busca vetorial KNN
          const hits = await searchByEmbedding(eventId, result.embedding, 0.7, 50);
          if (hits.length > 0) {
            // 3. Enriquecimento com dados das fotos
            const photoIds = hits.map((h) => h.photoId);
            const photos = await prisma.photo.findMany({
              where: { id: { in: photoIds } },
              select: {
                id: true,
                name: true,
                price: true,
                isPremium: true,
                photographer: { select: { user: { select: { name: true } } } },
              },
            });
            const photoMap = new Map(photos.map((p) => [p.id, p]));

            matches = hits
              .map((h) => {
                const p = photoMap.get(h.photoId);
                if (!p) return null;
                return {
                  photoId: h.photoId,
                  photoName: p.name,
                  matchPercent: h.matchPercent,
                  similarity: h.similarity,
                  distance: h.distance,
                  confidence: h.similarity,
                  price: p.price,
                  isPremium: p.isPremium,
                  photographerName: p.photographer?.user.name || "Fotógrafo",
                };
              })
              .filter((m): m is NonNullable<typeof m> => m !== null);

            return NextResponse.json(
              {
                matches,
                summary: {
                  total: matches.length,
                  bestMatch: matches[0]?.matchPercent || 0,
                  engine: "InsightFace + pgvector",
                  facesDetected: result.facesDetected,
                  detScore: result.detScore,
                },
              },
              { status: 200 }
            );
          }
        }
      } catch (err) {
        console.error("InsightFace error:", err);
      }
    }

    // === Nenhum motor disponível ===
    return NextResponse.json(
      {
        matches: [],
        message:
          "Reconhecimento facial indisponível. Use a busca por número de bibs ou por nome do fotógrafo.",
        unavailable: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("search-face error:", error);
    return NextResponse.json(
      { error: "Falha ao processar busca facial" },
      { status: 500 }
    );
  }
}
