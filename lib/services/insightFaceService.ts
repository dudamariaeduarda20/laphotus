/**
 * Ponte entre o Next.js e o microserviço Python (InsightFace) + pgvector.
 *
 * - embedImage(): envia uma imagem ao serviço Python e recebe o embedding 512-D
 * - storeEmbedding(): grava o embedding na coluna pgvector da FaceIndex
 * - searchByEmbedding(): busca KNN por distância de cosseno (pgvector)
 */
import prisma from "@/lib/db/prisma";

const FACE_SERVICE_URL =
  process.env.FACE_SERVICE_URL || "http://127.0.0.1:8000";

export interface EmbedResult {
  found: boolean;
  embedding: number[] | null;
  detScore?: number;
  bbox?: number[];
  facesDetected?: number;
}

/**
 * Extrai o embedding facial 512-D de uma imagem via InsightFace (Python).
 */
export async function embedImage(
  buffer: Buffer,
  fileName = "image.jpg",
  contentType = "image/jpeg"
): Promise<EmbedResult> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
  form.append("file", blob, fileName);

  const res = await fetch(`${FACE_SERVICE_URL}/embed`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Face service erro ${res.status}`);
  }

  const data = await res.json();
  return {
    found: !!data.found,
    embedding: data.embedding || null,
    detScore: data.det_score,
    bbox: data.bbox,
    facesDetected: data.faces_detected,
  };
}

/**
 * Converte um array de floats para o literal de vetor pgvector: "[a,b,c]".
 */
function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/**
 * Grava (upsert) o embedding 512-D na FaceIndex via pgvector.
 * Mantém também faceVector (JSON) para compatibilidade.
 */
export async function storeEmbedding(
  photoId: string,
  userId: string,
  embedding: number[],
  detScore = 1
) {
  const vectorLiteral = toVectorLiteral(embedding);

  // upsert manual: garante a linha e depois grava o vetor (Prisma não suporta
  // o tipo vector diretamente, por isso usamos SQL cru para a coluna embedding)
  await prisma.faceIndex.upsert({
    where: { userId_photoId: { userId, photoId } },
    update: {
      confidence: detScore,
      faceData: { engine: "insightface", model: "buffalo_l", dims: embedding.length },
    },
    create: {
      userId,
      photoId,
      confidence: detScore,
      faceData: { engine: "insightface", model: "buffalo_l", dims: embedding.length },
    },
  });

  await prisma.$executeRawUnsafe(
    `UPDATE "FaceIndex" SET embedding = $1::vector WHERE "userId" = $2 AND "photoId" = $3`,
    vectorLiteral,
    userId,
    photoId
  );
}

export interface FaceSearchMatch {
  photoId: string;
  distance: number;
  similarity: number;
  matchPercent: number;
}

/**
 * Busca vetorial KNN: encontra as fotos de um evento cujo rosto mais se
 * aproxima do embedding fornecido (distância de cosseno via pgvector).
 *
 * @param maxDistance distância máxima de cosseno (0 = idêntico).
 *   0.70 = máxima tolerância (reconhece mesmo fotos muito similares).
 */
export async function searchByEmbedding(
  eventId: string,
  embedding: number[],
  maxDistance = 0.7,
  limit = 50
): Promise<FaceSearchMatch[]> {
  const vectorLiteral = toVectorLiteral(embedding);

  // <=> = distância de cosseno no pgvector. Junta a Photo para filtrar por evento.
  const rows = await prisma.$queryRawUnsafe<
    { photoId: string; distance: number }[]
  >(
    `SELECT fi."photoId" AS "photoId",
            (fi.embedding <=> $1::vector) AS distance
       FROM "FaceIndex" fi
       JOIN "Photo" p ON p.id = fi."photoId"
      WHERE fi.embedding IS NOT NULL
        AND p."eventId" = $2
        AND p.status = 'AVAILABLE'
      ORDER BY fi.embedding <=> $1::vector
      LIMIT $3`,
    vectorLiteral,
    eventId,
    limit
  );

  return rows
    .map((r) => {
      const distance = Number(r.distance);
      const similarity = 1 - distance; // cosseno
      return {
        photoId: r.photoId,
        distance,
        similarity,
        matchPercent: Math.max(0, Math.round(similarity * 100)),
      };
    })
    .filter((m) => m.distance <= maxDistance);
}

/**
 * Verifica se o microserviço Python está disponível.
 */
export async function faceServiceHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${FACE_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
