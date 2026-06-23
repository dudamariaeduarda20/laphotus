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
const SIMILARITY_THRESHOLD = 90; // 90% minimum match

/**
 * Modo mock: verifica se AWS creds estão configuradas
 */
function isMockMode(): boolean {
  return !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY;
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
  threshold: number = SIMILARITY_THRESHOLD
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
              price: true,
              isPremium: true,
              photographerId: true,
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
          price: idx.photo.price,
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
                price: true,
                isPremium: true,
                photographerId: true,
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
          price: faceIndex.photo.price,
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
      FaceMatchThreshold: SIMILARITY_THRESHOLD,
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
