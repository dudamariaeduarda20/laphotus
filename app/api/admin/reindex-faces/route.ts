import { NextRequest, NextResponse } from "next/server";
import { RekognitionClient, IndexFacesCommand } from "@aws-sdk/client-rekognition";
import prisma from "@/lib/db/prisma";

/**
 * POST /api/admin/reindex-faces
 *
 * Versão HTTP de scripts/reindex-faces-aws.ts. Existe porque as env vars de
 * produção (DATABASE_URL, AWS_*) estão marcadas "Sensitive" no Vercel — não
 * dá pra `vercel env pull` o valor real pra rodar o script localmente. Correr
 * aqui dentro usa as env vars já presentes no runtime, sem nunca as expor.
 *
 * Protegido por header `x-reindex-secret` (== process.env.REINDEX_SECRET),
 * não por sessão de utilizador — chamado via curl/servidor, não browser.
 *
 * Idempotente: fotos já indexadas (awsFaceId presente) são ignoradas — seguro
 * invocar várias vezes (ex: se um timeout cortar a execução a meio).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REGION = process.env.AWS_REGION || "eu-west-1";
const COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION_ID || "laphotus-faces-prod";
const MAX_FACES_PER_PHOTO = 15;

async function fetchPhotoBytes(key: string): Promise<Buffer | null> {
  if (key.startsWith("http://") || key.startsWith("https://")) {
    const resp = await fetch(key);
    if (!resp.ok) throw new Error(`fetch ${resp.status} ${resp.statusText}`);
    return Buffer.from(await resp.arrayBuffer());
  }
  return null;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-reindex-secret");
  if (!secret || secret !== process.env.REINDEX_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { error: "AWS creds ausentes no runtime" },
      { status: 500 }
    );
  }

  const rekognition = new RekognitionClient({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const photos = await prisma.photo.findMany({
    where: { status: "AVAILABLE" },
    select: {
      id: true,
      key: true,
      name: true,
      photographer: { select: { userId: true } },
      faceMatches: { select: { faceVector: true } },
    },
  });

  const pending = photos.filter((p) => {
    const fi = p.faceMatches?.[0];
    if (!fi?.faceVector) return true;
    try {
      return !JSON.parse(fi.faceVector).awsFaceId;
    } catch {
      return true;
    }
  });

  let indexed = 0;
  let totalFaces = 0;
  let noFace = 0;
  let noSource = 0;
  const noFacePhotos: string[] = [];
  const noSourcePhotos: string[] = [];
  const failures: { name: string; error: string }[] = [];

  for (const photo of pending) {
    const userId = photo.photographer.userId;
    try {
      const bytes = await fetchPhotoBytes(photo.key);
      if (!bytes) {
        noSource++;
        noSourcePhotos.push(photo.name);
        continue;
      }

      const resp = await rekognition.send(
        new IndexFacesCommand({
          CollectionId: COLLECTION_ID,
          Image: { Bytes: new Uint8Array(bytes) },
          ExternalImageId: photo.id,
          MaxFaces: MAX_FACES_PER_PHOTO,
          QualityFilter: "AUTO",
          DetectionAttributes: [],
        })
      );

      const records = resp.FaceRecords || [];
      const awsFaceIds = records
        .map((r) => r.Face?.FaceId)
        .filter((id): id is string => !!id);

      if (awsFaceIds.length === 0) {
        noFace++;
        noFacePhotos.push(photo.name);
        await prisma.faceIndex.upsert({
          where: { userId_photoId: { userId, photoId: photo.id } },
          update: { confidence: 0, faceVector: JSON.stringify({ error: "no_face_detected" }) },
          create: {
            userId,
            photoId: photo.id,
            confidence: 0,
            faceVector: JSON.stringify({ error: "no_face_detected" }),
          },
        });
        continue;
      }

      totalFaces += awsFaceIds.length;
      const bestConf = Math.max(0, ...records.map((r) => r.Face?.Confidence ?? 0));
      const payload = {
        faceVector: JSON.stringify({ awsFaceId: awsFaceIds[0], awsFaceIds }),
        confidence: bestConf ? bestConf / 100 : 0.9,
        faceData: { engine: "aws-rekognition", faces: awsFaceIds.length },
      };
      await prisma.faceIndex.upsert({
        where: { userId_photoId: { userId, photoId: photo.id } },
        update: payload,
        create: { userId, photoId: photo.id, ...payload },
      });
      indexed++;
    } catch (err) {
      failures.push({
        name: photo.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    totalAvailable: photos.length,
    pendingAtStart: pending.length,
    indexed,
    totalFacesIndexed: totalFaces,
    noFace,
    noSource,
    failuresCount: failures.length,
    noFacePhotos,
    noSourcePhotos,
    failures,
  });
}
