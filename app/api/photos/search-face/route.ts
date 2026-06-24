import { NextRequest, NextResponse } from "next/server";
import {
  embedImage,
  searchByEmbedding,
  faceServiceHealthy,
} from "@/lib/services/insightFaceService";
import prisma from "@/lib/db/prisma";

/**
 * POST /api/photos/search-face
 *
 * Recebe um frame capturado pela câmera (multipart "file" + "eventId").
 * Fluxo (processamento pesado no servidor):
 *   1. InsightFace (Python) -> embedding ArcFace 512-D
 *   2. pgvector KNN por distância de cosseno -> fotos do mesmo rosto
 *   3. Enriquecimento com dados da foto -> devolve matches ordenados
 */
export async function POST(request: NextRequest) {
  try {
    // Garante que o microserviço de embeddings está vivo
    if (!(await faceServiceHealthy())) {
      return NextResponse.json(
        {
          error:
            "Serviço de reconhecimento facial indisponível. Inicie o face-service (porta 8000).",
        },
        { status: 503 }
      );
    }

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

    // 1. Embedding via InsightFace
    const result = await embedImage(buffer, "selfie.jpg", file.type);
    if (!result.found || !result.embedding) {
      return NextResponse.json(
        {
          matches: [],
          message: "Nenhum rosto detetado. Enquadre bem o rosto e tente de novo.",
        },
        { status: 200 }
      );
    }

    // 2. Busca vetorial KNN (pgvector, distância de cosseno)
    const hits = await searchByEmbedding(eventId, result.embedding, 0.35, 50);

    if (hits.length === 0) {
      return NextResponse.json(
        {
          matches: [],
          message: "Sem correspondências para este rosto neste evento",
        },
        { status: 200 }
      );
    }

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

    const matches = hits
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
  } catch (error) {
    console.error("search-face error:", error);
    return NextResponse.json(
      { error: "Falha ao processar busca facial" },
      { status: 500 }
    );
  }
}
