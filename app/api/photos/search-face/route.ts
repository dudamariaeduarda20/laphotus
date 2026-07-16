import { NextRequest, NextResponse } from "next/server";
import { rateLimits } from "@/lib/middleware/rateLimit";
import {
  embedImage,
  searchByEmbedding,
  faceServiceHealthy,
} from "@/lib/services/insightFaceService";
import {
  searchFacesByAWSRekognition,
  isUsingAWSRekognition,
} from "@/lib/services/faceService";
import prisma from "@/lib/db/prisma";

type Match = {
  photoId: string;
  photoName: string;
  matchPercent: number;
  similarity: number;
  confidence: number;
  price: number;
  isPremium: boolean;
  photographerName: string;
  engine?: string;
  distance?: number;
};

/**
 * Busca via InsightFace + pgvector (embeddings 512-D). Só funciona se o
 * microserviço Python (face-service / FACE_SERVICE_URL) estiver online E as
 * fotos tiverem embedding pgvector indexado. Retorna [] caso contrário.
 */
async function searchPgvector(
  eventId: string,
  buffer: Buffer,
  fileType: string
): Promise<Match[]> {
  if (!(await faceServiceHealthy())) return [];
  try {
    const result = await embedImage(buffer, "selfie.jpg", fileType);
    if (!result.found || !result.embedding) {
      console.log("[face] pgvector: nenhum rosto na selfie");
      return [];
    }
    const hits = await searchByEmbedding(eventId, result.embedding, 0.8, 50);
    console.log(`[face] pgvector hits=${hits.length}`);
    if (hits.length === 0) return [];

    const photos = await prisma.photo.findMany({
      where: { id: { in: hits.map((h) => h.photoId) } },
      select: {
        id: true,
        name: true,
        isPremium: true,
        event: { select: { priceEUR: true } },
        photographer: { select: { user: { select: { name: true } } } },
      },
    });
    const photoMap = new Map(photos.map((p) => [p.id, p]));

    return hits
      .map((h): Match | null => {
        const p = photoMap.get(h.photoId);
        if (!p) return null;
        return {
          photoId: h.photoId,
          photoName: p.name,
          matchPercent: h.matchPercent,
          similarity: h.similarity,
          distance: h.distance,
          confidence: h.similarity,
          price: p.event?.priceEUR || 0,
          isPremium: p.isPremium,
          photographerName: p.photographer?.user.name || "Fotógrafo",
          engine: "pgvector",
        };
      })
      .filter((m): m is Match => m !== null);
  } catch (err) {
    console.error("[face] pgvector error:", err);
    return [];
  }
}

/** Une dois conjuntos de matches, deduplicando por photoId (mantém maior match%). */
function mergeMatches(a: Match[], b: Match[]): Match[] {
  const byId = new Map<string, Match>();
  for (const m of [...a, ...b]) {
    const prev = byId.get(m.photoId);
    if (!prev || m.matchPercent > prev.matchPercent) byId.set(m.photoId, m);
  }
  return [...byId.values()].sort((x, y) => y.matchPercent - x.matchPercent);
}

/**
 * POST /api/photos/search-face
 *
 * Recebe frame/selfie (multipart "file" + "eventId").
 *
 * Motor: AWS Rekognition (principal, threshold tolerante) + pgvector (fallback
 * automático quando Rekognition acha 0 OU quando desligado). Resultados são
 * combinados/deduplicados para maximizar recall em fotos espontâneas.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimits.searchFace(request);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const eventId = formData.get("eventId") as string | null;
    const ageRange = formData.get("ageRange") as string | null;
    const gender = formData.get("gender") as string | null;

    if (!file || !eventId) {
      return NextResponse.json(
        { error: "Imagem e evento são obrigatórios" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filters = {
      ...(ageRange && { ageRange }),
      ...(gender && { gender }),
    };

    // === Motor principal: AWS Rekognition ===
    if (isUsingAWSRekognition()) {
      let awsMatches: Match[] = [];
      try {
        awsMatches = (
          await searchFacesByAWSRekognition(
            eventId,
            buffer,
            Object.keys(filters).length > 0 ? filters : undefined
          )
        ).map((m) => ({ ...m, engine: "aws-rekognition" }));
      } catch (err) {
        console.error("[face] AWS Rekognition error:", err);
        // Não aborta — tenta pgvector como rede de segurança.
      }

      // Fallback/combine automático com pgvector (só age se face-service online).
      const pgMatches = await searchPgvector(eventId, buffer, file.type);
      const matches = mergeMatches(awsMatches, pgMatches);

      const engine =
        awsMatches.length && pgMatches.length
          ? "AWS Rekognition + pgvector"
          : pgMatches.length
            ? "pgvector (fallback)"
            : "AWS Rekognition";

      console.log(
        `[face] final event=${eventId} aws=${awsMatches.length} pg=${pgMatches.length} merged=${matches.length}`
      );

      return NextResponse.json(
        {
          matches,
          summary: {
            total: matches.length,
            bestMatch: matches[0]?.matchPercent || 0,
            engine,
            usingFallback: false,
          },
          ...(matches.length === 0 && {
            message: "Nenhuma foto sua encontrada neste evento.",
          }),
        },
        { status: 200 }
      );
    }

    // === Rekognition desligado: só pgvector ===
    const pgMatches = await searchPgvector(eventId, buffer, file.type);
    if (pgMatches.length > 0) {
      return NextResponse.json(
        {
          matches: pgMatches,
          summary: {
            total: pgMatches.length,
            bestMatch: pgMatches[0]?.matchPercent || 0,
            engine: "InsightFace + pgvector (80% tolerance)",
            usingFallback: true,
          },
        },
        { status: 200 }
      );
    }

    // === Nenhum motor disponível ===
    return NextResponse.json(
      {
        matches: [],
        message:
          "Reconhecimento facial indisponível. Use a busca por número de dorsal ou por nome do fotógrafo.",
        unavailable: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[face] search-face error:", error);
    return NextResponse.json(
      { error: "Falha ao processar busca facial" },
      { status: 500 }
    );
  }
}
