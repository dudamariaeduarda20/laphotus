import { NextRequest, NextResponse } from "next/server";
import { rateLimits } from "@/lib/middleware/rateLimit";
import {
  embedImage,
  searchByEmbedding,
  faceServiceHealthy,
} from "@/lib/services/insightFaceService";
import {
  awsEnabled,
  searchFacesByBytes,
  searchFacesByAWSRekognition,
  isUsingAWSRekognition,
  isFallbackMode,
} from "@/lib/services/faceService";
import prisma from "@/lib/db/prisma";

/**
 * POST /api/photos/search-face
 *
 * Recebe um frame capturado pela câmera (multipart "file" + "eventId").
 *
 * Motor de identity matching (ordem de prioridade):
 *   1. AWS Rekognition — SearchFacesByImage real (se creds presentes)
 *   2. InsightFace + pgvector — embeddings reais (se face-service ativo)
 *
 * NOTA: Google Cloud Vision NÃO faz identity matching (só deteta rostos),
 * por isso foi removido. Ver lib/services/googleVisionService.
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
    let usingFallback = false;

    // Debug: log engine availability
    console.log("[search-face] Engine status:", {
      awsExplicitEnabled: isUsingAWSRekognition(),
      fallbackMode: isFallbackMode(),
      faceServiceUrl: !!process.env.FACE_SERVICE_URL,
      env: process.env.NODE_ENV,
    });

    // === Motor 1: AWS Rekognition (se EXPLICITAMENTE HABILITADO) ===
    if (isUsingAWSRekognition()) {
      try {
        matches = await searchFacesByAWSRekognition(eventId, buffer);
        if (matches.length > 0) {
          engine = "AWS Rekognition (99% strict)";
          return NextResponse.json(
            {
              matches,
              summary: {
                total: matches.length,
                bestMatch: matches[0]?.matchPercent || 0,
                engine,
                usingFallback: false,
              },
            },
            { status: 200 }
          );
        }
      } catch (err) {
        console.error("AWS Rekognition error:", err);
        // Fallback para próximo motor
      }
    }

    // === Motor 2: InsightFace + pgvector (fallback: face-service ativo) ===
    if (await faceServiceHealthy()) {
      usingFallback = true;
      try {
        // 1. Embedding via InsightFace
        const result = await embedImage(buffer, "selfie.jpg", file.type);
        if (result.found && result.embedding) {
          // 2. Busca vetorial KNN (threshold 80% para fallback tolerante)
          const hits = await searchByEmbedding(eventId, result.embedding, 0.80, 50);
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
                  engine: "InsightFace + pgvector (80% tolerance)",
                  facesDetected: result.facesDetected,
                  detScore: result.detScore,
                  usingFallback: true,
                  fallbackMessage:
                    "Busca em nível de prototipagem — versão final em breve",
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
        usingFallback,
        fallbackMessage: usingFallback
          ? "Busca em nível de prototipagem — versão final em breve"
          : undefined,
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
