import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  SearchFacesCommand,
} from "@aws-sdk/client-rekognition";
import prisma from "@/lib/db/prisma";
import { getS3SignedUrl } from "@/lib/services/s3Service";

// AWS Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION_ID || "laphotus-faces-prod";

// Threshold de match AWS (0-100). Default 80 = só matches de alta confiança,
// evita falsos-positivos (comprador vê foto de estranho). Ajustável via
// AWS_FACE_THRESHOLD — baixar tolera mais fotos espontâneas (suor/ângulo) mas
// ↑ falsos-positivos; subir é mais estrito mas pode perder fotos válidas.
export const AWS_FACE_THRESHOLD = (() => {
  const v = Number(process.env.AWS_FACE_THRESHOLD);
  return Number.isFinite(v) && v > 0 && v <= 100 ? v : 80;
})();
const PGVECTOR_THRESHOLD = 80; // 80% = pgvector (fallback tolerante)
const MAX_FACES_PER_PHOTO = 15; // multi-face: fotos de grupo/prova indexam todos os rostos

/** Lê um flag booleano tolerante a aspas/espaços/caixa: "true", " True ", etc. */
function envTrue(v?: string): boolean {
  return (v ?? "").trim().replace(/^["']|["']$/g, "").trim().toLowerCase() === "true";
}

/** Creds AWS presentes (trim — apanha valores só-espaços). */
function hasAwsCreds(): boolean {
  return (
    !!process.env.AWS_ACCESS_KEY_ID?.trim() &&
    !!process.env.AWS_SECRET_ACCESS_KEY?.trim()
  );
}

/**
 * Modo mock: verifica se AWS creds estão configuradas
 */
function isMockMode(): boolean {
  return !hasAwsCreds();
}

/** AWS Rekognition ativo (env var explícito OU creds presentes). */
export function awsEnabled(): boolean {
  return envTrue(process.env.AWS_REKOGNITION_ENABLED) || hasAwsCreds();
}

/**
 * AWS Rekognition é o motor de busca ativo.
 *
 * Ativo quando creds presentes E não desligado explicitamente. Basta ter creds
 * — se o fotógrafo indexou via AWS no upload (awsEnabled: flag OU creds), a
 * busca TEM de usar AWS também, senão cai no pgvector e não acha nada.
 * Para forçar OFF: AWS_REKOGNITION_ENABLED="false".
 */
export function isUsingAWSRekognition(): boolean {
  if (!hasAwsCreds()) return false;
  const raw = (process.env.AWS_REKOGNITION_ENABLED ?? "").trim();
  if (raw === "") return true; // creds presentes, sem flag → liga
  return envTrue(raw); // flag presente → respeita "true"/"false"
}

/** Fallback ativo: usando pgvector em lugar de AWS. */
export function isFallbackMode(): boolean {
  return !isUsingAWSRekognition();
}

/**
 * IndexFaces com bytes crus (sem S3) na coleção AWS. Usado no upload quando o
 * Rekognition está ativo. Guarda o awsFaceId em faceVector para a busca mapear.
 */
export async function indexFaceByBytes(
  photoId: string,
  userId: string,
  imageBytes: Buffer
) {
  const cmd = new IndexFacesCommand({
    CollectionId: COLLECTION_ID,
    Image: { Bytes: new Uint8Array(imageBytes) },
    ExternalImageId: photoId,
    MaxFaces: MAX_FACES_PER_PHOTO, // indexa TODOS os rostos (grupo/prova)
    QualityFilter: "AUTO",
    DetectionAttributes: [],
  });

  const resp = await rekognitionClient.send(cmd);
  const records = resp.FaceRecords || [];
  const awsFaceIds = records
    .map((r) => r.Face?.FaceId)
    .filter((id): id is string => !!id);
  if (awsFaceIds.length === 0) return null;

  const bestConf = Math.max(0, ...records.map((r) => r.Face?.Confidence ?? 0));
  // Guarda awsFaceId (compat legado) + awsFaceIds[] (multi-face). A busca casa
  // por `contains` em qualquer id, logo ambos os formatos funcionam.
  const payload = {
    faceVector: JSON.stringify({ awsFaceId: awsFaceIds[0], awsFaceIds }),
    confidence: bestConf ? bestConf / 100 : 0.9,
    faceData: { engine: "aws-rekognition", faces: awsFaceIds.length },
  };

  console.log(`[face] index photo=${photoId} faces=${awsFaceIds.length}`);

  return prisma.faceIndex.upsert({
    where: { userId_photoId: { userId, photoId } },
    update: payload,
    create: { userId, photoId, ...payload },
  });
}

/**
 * SearchFacesByImage com bytes crus (sem S3). Usado na busca por selfie quando
 * o AWS Rekognition está ativo. Threshold comercial 80% (óculos/boné/luz).
 * Mapeia FaceId -> Photo via awsFaceId guardado em faceVector.
 *
 * DEPRECATED: use searchFacesByAWSRekognition() em seu lugar (threshold configurável).
 */
export async function searchFacesByBytes(
  eventId: string,
  imageBytes: Buffer,
  threshold: number = PGVECTOR_THRESHOLD
) {
  const cmd = new SearchFacesByImageCommand({
    CollectionId: COLLECTION_ID,
    Image: { Bytes: new Uint8Array(imageBytes) },
    MaxFaces: 50,
    FaceMatchThreshold: threshold,
  });

  const resp = await rekognitionClient.send(cmd);
  const faceMatches = resp.FaceMatches || [];
  if (faceMatches.length === 0) return [];

  const matches = await Promise.all(
    faceMatches.map(async (m) => {
      const awsFaceId = m.Face?.FaceId;
      if (!awsFaceId) return null;
      const similarity = (m.Similarity || 0) / 100;

      const faceIndex = await prisma.faceIndex.findFirst({
        where: {
          faceVector: { contains: awsFaceId },
          photo: { eventId, status: "AVAILABLE" },
        },
        include: {
          photo: {
            select: {
              id: true,
              name: true,
              isPremium: true,
              event: { select: { priceEUR: true } },
              photographer: { select: { user: { select: { name: true } } } },
            },
          },
        },
      });
      if (!faceIndex) return null;

      return {
        photoId: faceIndex.photo.id,
        photoName: faceIndex.photo.name,
        matchPercent: Math.round(similarity * 100),
        similarity,
        confidence: similarity,
        price: faceIndex.photo.event?.priceEUR || 0,
        isPremium: faceIndex.photo.isPremium,
        photographerName: faceIndex.photo.photographer?.user.name || "Fotógrafo",
      };
    })
  );

  return matches
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => b.matchPercent - a.matchPercent);
}

/**
 * searchFacesByAWSRekognition: procura por selfie usando AWS Rekognition.
 *
 * Threshold estrito (AWS_FACE_THRESHOLD, default 80) — só matches de alta
 * confiança, evita falsos-positivos. Retorna array ordenado por match%.
 */
export async function searchFacesByAWSRekognition(
  eventId: string,
  imageBytes: Buffer
) {
  if (!isUsingAWSRekognition()) {
    console.warn("[face] Rekognition off — a busca vai tentar pgvector.");
    return [];
  }

  const cmd = new SearchFacesByImageCommand({
    CollectionId: COLLECTION_ID,
    Image: { Bytes: new Uint8Array(imageBytes) },
    MaxFaces: 50,
    FaceMatchThreshold: AWS_FACE_THRESHOLD,
  });

  const resp = await rekognitionClient.send(cmd);
  const faceMatches = resp.FaceMatches || [];
  const selfieConf = resp.SearchedFaceConfidence?.toFixed(1) ?? "n/a";
  console.log(
    `[face] AWS search event=${eventId} threshold=${AWS_FACE_THRESHOLD} ` +
      `selfieFaceConf=${selfieConf} rawMatches=${faceMatches.length} ` +
      `scores=[${faceMatches.map((m) => (m.Similarity || 0).toFixed(1)).join(",")}]`
  );
  if (faceMatches.length === 0) return [];

  const matches = await Promise.all(
    faceMatches.map(async (m) => {
      const awsFaceId = m.Face?.FaceId;
      if (!awsFaceId) return null;
      const similarity = (m.Similarity || 0) / 100;

      const faceIndex = await prisma.faceIndex.findFirst({
        where: {
          faceVector: { contains: awsFaceId },
          photo: { eventId, status: "AVAILABLE" },
        },
        include: {
          photo: {
            select: {
              id: true,
              name: true,
              isPremium: true,
              event: { select: { priceEUR: true } },
              photographer: { select: { user: { select: { name: true } } } },
            },
          },
        },
      });
      if (!faceIndex) return null;

      return {
        photoId: faceIndex.photo.id,
        photoName: faceIndex.photo.name,
        matchPercent: Math.round(similarity * 100),
        similarity,
        confidence: similarity,
        price: faceIndex.photo.event?.priceEUR || 0,
        isPremium: faceIndex.photo.isPremium,
        photographerName: faceIndex.photo.photographer?.user.name || "Fotógrafo",
      };
    })
  );

  const resolved = matches
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => b.matchPercent - a.matchPercent);
  console.log(
    `[face] AWS resolved=${resolved.length}/${faceMatches.length} ` +
      `(matches sem FaceIndex no evento são descartados)`
  );
  return resolved;
}

/**
 * IndexFaces: indexa rosto de foto via AWS Rekognition
 * Retorna FaceId único gerado pela Amazon
 */
export async function processFaceIndex(
  photoId: string,
  userId: string,
  photoName: string
) {
  try {
    if (isMockMode()) {
      // Mock: simula FaceId
      const mockFaceId = `face_${photoId.slice(0, 8)}_${Date.now()}`;
      const faceIndex = await prisma.faceIndex.upsert({
        where: { userId_photoId: { userId, photoId } },
        update: {
          faceVector: JSON.stringify({ mockFaceId, mode: "mock" }),
          confidence: 0.95,
          faceData: {
            age: 30,
            gender: "Unknown",
            emotions: { happy: 0.8 },
            source: "mock",
          },
        },
        create: {
          userId,
          photoId,
          faceVector: JSON.stringify({ mockFaceId, mode: "mock" }),
          confidence: 0.95,
          faceData: {
            age: 30,
            gender: "Unknown",
            emotions: { happy: 0.8 },
            source: "mock",
          },
        },
      });
      console.log(`[Face] Mock indexed: ${photoId}`);
      return faceIndex;
    }

    // Real AWS Rekognition: IndexFaces
    const indexFacesCommand = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET || "",
          Name: photoName, // S3 key
        },
      },
      MaxFaces: 1, // Apenas 1 rosto por foto
      QualityFilter: "HIGH", // Alta qualidade apenas
    });

    const indexResponse = await rekognitionClient.send(indexFacesCommand);
    const faceRecords = indexResponse.FaceRecords || [];

    if (faceRecords.length === 0) {
      console.warn(`[Face] Nenhum rosto detectado em: ${photoId}`);
      // Fallback: cria entry vazia
      return prisma.faceIndex.upsert({
        where: { userId_photoId: { userId, photoId } },
        update: { confidence: 0 },
        create: {
          userId,
          photoId,
          confidence: 0,
          faceVector: JSON.stringify({ error: "no_face_detected" }),
        },
      });
    }

    // Primeira detecção
    const faceRecord = faceRecords[0];
    const faceDetail = faceRecord.FaceDetail!;
    const awsFaceId = faceRecord.Face!.FaceId!;

    // Extrai metadados do rosto
    const faceData = {
      awsFaceId, // ID único da Amazon
      age: faceDetail.AgeRange
        ? { low: faceDetail.AgeRange.Low, high: faceDetail.AgeRange.High }
        : null,
      gender: faceDetail.Gender ? faceDetail.Gender.Value : "Unknown",
      emotions: (faceDetail.Emotions || []).reduce(
        (acc, e) => {
          acc[e.Type as string] = e.Confidence || 0;
          return acc;
        },
        {} as Record<string, number>
      ),
      landmarks: (faceDetail.Landmarks || []).map((l) => ({
        type: l.Type,
        x: l.X || 0,
        y: l.Y || 0,
      })),
      confidence: faceDetail.Confidence || 0,
      quality: {
        brightness: faceDetail.Quality?.Brightness || 0,
        sharpness: faceDetail.Quality?.Sharpness || 0,
      },
    };

    // Guardar no DB (usa awsFaceId como identificador único)
    const faceIndex = await prisma.faceIndex.upsert({
      where: { userId_photoId: { userId, photoId } },
      update: {
        faceVector: JSON.stringify({ awsFaceId }),
        confidence: faceDetail.Confidence || 0.9,
        faceData: faceData as unknown as object,
      },
      create: {
        userId,
        photoId,
        faceVector: JSON.stringify({ awsFaceId }),
        confidence: faceDetail.Confidence || 0.9,
        faceData: faceData as unknown as object,
      },
    });

    console.log(`[Face] AWS Rekognition indexed: ${photoId} (FaceId: ${awsFaceId})`);
    return faceIndex;
  } catch (error) {
    console.error(`[Face] Error indexing ${photoId}:`, error);
    // Fallback gracioso
    return prisma.faceIndex.upsert({
      where: { userId_photoId: { userId, photoId } },
      update: { confidence: 0 },
      create: {
        userId,
        photoId,
        confidence: 0,
        faceVector: JSON.stringify({
          error: error instanceof Error ? error.message : "unknown",
        }),
      },
    });
  }
}

/**
 * SearchFacesByImage: procura selfie em evento via AWS Rekognition
 * Retorna matches com threshold 90%
 */
export async function matchFaceInEvent(
  eventId: string,
  selfieS3Key: string,
  threshold: number = PGVECTOR_THRESHOLD
) {
  try {
    if (isMockMode()) {
      // Mock: retorna matches de teste
      console.log("[Face] Mock search mode");
      const faceIndexes = await prisma.faceIndex.findMany({
        where: {
          photo: { eventId, status: "AVAILABLE" },
        },
        include: {
          photo: {
            select: {
              id: true,
              name: true,
              isPremium: true,
              photographerId: true,
              event: { select: { priceEUR: true } },
              photographer: { select: { user: { select: { name: true } } } },
            },
          },
        },
      });

      return faceIndexes
        .slice(0, 3) // Mock: retorna primeiras 3
        .map((idx) => ({
          photoId: idx.photo.id,
          photoName: idx.photo.name,
          matchPercent: Math.floor(85 + Math.random() * 15),
          similarity: 0.85 + Math.random() * 0.15,
          confidence: idx.confidence,
          price: idx.photo.event?.priceEUR || 0,
          isPremium: idx.photo.isPremium,
          photographerName: idx.photo.photographer?.user.name || "Unknown",
        }));
    }

    // Real AWS Rekognition: SearchFacesByImage
    const searchCommand = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET || "",
          Name: selfieS3Key,
        },
      },
      MaxFaces: 50,
      FaceMatchThreshold: threshold,
    });

    const searchResponse = await rekognitionClient.send(searchCommand);
    const faceMatches = searchResponse.FaceMatches || [];

    if (faceMatches.length === 0) {
      console.log(`[Face] Nenhum match acima de ${threshold}% para selfie`);
      return [];
    }

    // Mapeia matches para fotos
    const matches = await Promise.all(
      faceMatches.map(async (match) => {
        const awsFaceId = match.Face!.FaceId!;
        const similarity = (match.Similarity || 0) / 100; // AWS retorna 0-100

        // Busca FaceIndex pelo awsFaceId
        const faceIndex = await prisma.faceIndex.findFirst({
          where: {
            faceVector: {
              contains: awsFaceId,
            },
          },
          include: {
            photo: {
              select: {
                id: true,
                name: true,
                isPremium: true,
                photographerId: true,
                event: { select: { priceEUR: true } },
                photographer: { select: { user: { select: { name: true } } } },
              },
            },
          },
        });

        if (!faceIndex) {
          console.warn(`[Face] FaceIndex not found for AWS FaceId: ${awsFaceId}`);
          return null;
        }

        return {
          photoId: faceIndex.photo.id,
          photoName: faceIndex.photo.name,
          matchPercent: Math.round(similarity * 100),
          similarity,
          confidence: faceIndex.confidence,
          price: faceIndex.photo.event?.priceEUR || 0,
          isPremium: faceIndex.photo.isPremium,
          photographerName:
            faceIndex.photo.photographer?.user.name || "Unknown",
          awsFaceId,
        };
      })
    );

    // Remove nulls e ordena por match%
    return matches
      .filter((m) => m !== null)
      .sort((a, b) => b!.matchPercent - a!.matchPercent);
  } catch (error) {
    console.error(`[Face] Error searching faces:`, error);
    return [];
  }
}

/**
 * Guarda um descritor facial REAL (128-D) extraído no browser via face-api.js.
 * Usado no upload quando o fotógrafo carrega uma foto com rosto detetado.
 */
export async function storeFaceDescriptor(
  photoId: string,
  userId: string,
  descriptor: number[]
) {
  return prisma.faceIndex.upsert({
    where: { userId_photoId: { userId, photoId } },
    update: {
      faceVector: JSON.stringify({ descriptor, engine: "face-api.js" }),
      confidence: 0.99,
      faceData: { engine: "face-api.js", dims: descriptor.length },
    },
    create: {
      userId,
      photoId,
      faceVector: JSON.stringify({ descriptor, engine: "face-api.js" }),
      confidence: 0.99,
      faceData: { engine: "face-api.js", dims: descriptor.length },
    },
  });
}

/**
 * Distância euclidiana entre dois descritores faciais (face-api.js standard).
 * 0 = idêntico. Limiar típico de "mesma pessoa": < 0.6.
 */
function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Reconhecimento facial REAL via descritor face-api.js (128-D).
 *
 * Recebe o descritor extraído no browser a partir da selfie e compara-o, por
 * distância euclidiana, contra todos os descritores reais guardados em
 * FaceIndex para as fotos do evento. Devolve apenas as fotos da MESMA pessoa.
 *
 * @param maxDistance limiar de distância (menor = mais estrito). 0.55 default.
 */
export async function matchFaceByDescriptor(
  eventId: string,
  descriptor: number[],
  maxDistance: number = 0.55
) {
  const faceIndexes = await prisma.faceIndex.findMany({
    where: {
      photo: { eventId, status: "AVAILABLE" },
    },
    include: {
      photo: {
        select: {
          id: true,
          name: true,
          isPremium: true,
          photographerId: true,
          event: { select: { priceEUR: true } },
          photographer: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const matches = faceIndexes
    .map((idx) => {
      // O descritor real fica guardado em faceVector como { descriptor: [...] }
      let stored: number[] | null = null;
      try {
        const parsed = JSON.parse(idx.faceVector || "{}");
        if (Array.isArray(parsed.descriptor)) stored = parsed.descriptor;
      } catch {
        stored = null;
      }

      if (!stored || stored.length !== descriptor.length) return null;

      const distance = euclideanDistance(descriptor, stored);
      // Converte distância -> percentagem legível (0 dist = 100%)
      const matchPercent = Math.max(
        0,
        Math.round((1 - distance) * 100)
      );

      return {
        photoId: idx.photo.id,
        photoName: idx.photo.name,
        distance,
        matchPercent,
        similarity: 1 - distance,
        confidence: idx.confidence,
        price: idx.photo.event?.priceEUR || 0,
        isPremium: idx.photo.isPremium,
        photographerName: idx.photo.photographer?.user.name || "Unknown",
      };
    })
    .filter(
      (m): m is NonNullable<typeof m> => m !== null && m.distance <= maxDistance
    )
    .sort((a, b) => a.distance - b.distance);

  return matches;
}

/**
 * CompareFaces: compara duas faces específicas (future: validação manual)
 */
export async function compareTwoFaces(
  faceId1: string,
  faceId2: string
): Promise<{
  isSameMatch: boolean;
  similarity: number;
}> {
  try {
    if (isMockMode()) {
      return { isSameMatch: true, similarity: 0.95 };
    }

    // AWS CompareFaces
    const compareCommand = new SearchFacesCommand({
      CollectionId: COLLECTION_ID,
      FaceId: faceId1,
      MaxFaces: 1,
      FaceMatchThreshold: PGVECTOR_THRESHOLD,
    });

    const compareResponse = await rekognitionClient.send(compareCommand);
    const matches = compareResponse.FaceMatches || [];

    const found = matches.find((m) => m.Face!.FaceId === faceId2);
    if (!found) {
      return { isSameMatch: false, similarity: 0 };
    }

    return {
      isSameMatch: true,
      similarity: (found.Similarity || 0) / 100,
    };
  } catch (error) {
    console.error(`[Face] Error comparing faces:`, error);
    return { isSameMatch: false, similarity: 0 };
  }
}

/**
 * Clustering: agrupa rostos semelhantes (AWS Rekognition)
 */
export async function clusterSimilarFaces(eventId: string) {
  const faceIndexes = await prisma.faceIndex.findMany({
    where: { photo: { eventId } },
  });

  if (faceIndexes.length === 0) {
    return {
      total: 0,
      clusters: {},
      optimizationScore: 0,
    };
  }

  // Group by confidence
  const clusters = {
    high_confidence: faceIndexes.filter((f) => f.confidence >= 0.95),
    medium_confidence: faceIndexes.filter(
      (f) => f.confidence >= 0.85 && f.confidence < 0.95
    ),
    low_confidence: faceIndexes.filter((f) => f.confidence < 0.85),
  };

  return {
    total: faceIndexes.length,
    clusters,
    optimizationScore: (faceIndexes.length / (faceIndexes.length + 1)) * 100,
  };
}

/**
 * Atualiza face vector (futuro: correções manuais)
 */
export async function updateFaceVector(
  photoId: string,
  userId: string,
  faceData: Record<string, unknown>,
  confidence: number
) {
  return prisma.faceIndex.upsert({
    where: { userId_photoId: { userId, photoId } },
    update: {
      faceVector: JSON.stringify(faceData),
      confidence,
    },
    create: {
      userId,
      photoId,
      faceVector: JSON.stringify(faceData),
      confidence,
    },
  });
}
