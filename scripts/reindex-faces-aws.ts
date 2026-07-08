/**
 * Re-indexa fotos existentes no AWS Rekognition (via Bytes, sem S3).
 *
 * As fotos vivem no Supabase Storage (bucket "fotos") — `photo.key` guarda a
 * URL pública. O script busca os bytes de cada foto e chama IndexFaces com
 * Image.Bytes (NÃO S3Object). Grava o FaceId em FaceIndex. Fotos sem rosto
 * detetável ficam registadas com confidence 0.
 *
 * Idempotente: fotos já indexadas (awsFaceId presente) são ignoradas.
 *
 * Uso (creds AWS + DB de produção):
 *   AWS_REKOGNITION_ENABLED=true \
 *   AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... AWS_REGION=eu-north-1 \
 *   AWS_REKOGNITION_COLLECTION_ID=laphotus-faces-prod \
 *   DATABASE_URL="<supabase-pooler-url>" npx tsx scripts/reindex-faces-aws.ts
 *
 * Pré-requisito: a coleção Rekognition tem de existir. Criar uma vez:
 *   aws rekognition create-collection --collection-id laphotus-faces-prod --region eu-north-1
 */
import { RekognitionClient, IndexFacesCommand } from "@aws-sdk/client-rekognition";
import prisma from "@/lib/db/prisma";
import { readFile } from "fs/promises";
import path from "path";

const REGION = process.env.AWS_REGION || "eu-north-1";
const COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION_ID || "laphotus-faces-prod";
const MAX_FACES_PER_PHOTO = 15; // indexa todos os rostos por foto (grupo/prova)

const rekognition = new RekognitionClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Resolve os bytes da foto a partir da `key`.
 * - URL http(s) (Supabase Storage) → fetch.
 * - "uploads/..." (dev local) → lê de public/.
 * - Caso contrário (placeholder/seed) → null (sem fonte real).
 */
async function fetchPhotoBytes(key: string): Promise<Buffer | null> {
  if (key.startsWith("http://") || key.startsWith("https://")) {
    const resp = await fetch(key);
    if (!resp.ok) throw new Error(`fetch ${resp.status} ${resp.statusText}`);
    return Buffer.from(await resp.arrayBuffer());
  }
  if (key.startsWith("uploads/")) {
    return readFile(path.join(process.cwd(), "public", key));
  }
  return null;
}

async function main() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ AWS creds ausentes (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY).");
    process.exit(1);
  }

  console.log(`Região: ${REGION} | Coleção: ${COLLECTION_ID}\n`);

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

  // Ignora as que já têm awsFaceId indexado (idempotência).
  const pending = photos.filter((p) => {
    const fi = p.faceMatches?.[0];
    if (!fi?.faceVector) return true;
    try {
      return !JSON.parse(fi.faceVector).awsFaceId;
    } catch {
      return true;
    }
  });

  console.log(`Total AVAILABLE: ${photos.length} | a indexar: ${pending.length}\n`);

  let indexed = 0;
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
        console.log(`? ${photo.name}: sem fonte de imagem (key="${photo.key}")`);
        continue;
      }

      const resp = await rekognition.send(
        new IndexFacesCommand({
          CollectionId: COLLECTION_ID,
          Image: { Bytes: new Uint8Array(bytes) },
          ExternalImageId: photo.id,
          MaxFaces: MAX_FACES_PER_PHOTO, // multi-face: grupo/prova indexa todos
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
        console.log(`– ${photo.name}: nenhum rosto detetável`);
        continue;
      }

      const bestConf = Math.max(0, ...records.map((r) => r.Face?.Confidence ?? 0));
      const confidence = bestConf ? bestConf / 100 : 0.9;
      await prisma.faceIndex.upsert({
        where: { userId_photoId: { userId, photoId: photo.id } },
        update: {
          faceVector: JSON.stringify({ awsFaceId: awsFaceIds[0], awsFaceIds }),
          confidence,
          faceData: { engine: "aws-rekognition", faces: awsFaceIds.length },
        },
        create: {
          userId,
          photoId: photo.id,
          faceVector: JSON.stringify({ awsFaceId: awsFaceIds[0], awsFaceIds }),
          confidence,
          faceData: { engine: "aws-rekognition", faces: awsFaceIds.length },
        },
      });
      indexed++;
      console.log(`✓ ${photo.name} → ${awsFaceIds.length} rosto(s) [${awsFaceIds.join(", ")}]`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ name: photo.name, error: msg });
      console.log(`✗ ${photo.name}: ${msg}`);
    }
  }

  console.log("\n===== RELATÓRIO =====");
  console.log(`Indexadas:   ${indexed}`);
  console.log(`Sem rosto:   ${noFace}`);
  console.log(`Sem fonte:   ${noSource}`);
  console.log(`Falhas:      ${failures.length}`);
  if (noFacePhotos.length) {
    console.log(`\nSem rosto detetável (${noFacePhotos.length}):`);
    noFacePhotos.forEach((n) => console.log(`  - ${n}`));
  }
  if (noSourcePhotos.length) {
    console.log(`\nSem fonte de imagem (${noSourcePhotos.length}):`);
    noSourcePhotos.forEach((n) => console.log(`  - ${n}`));
  }
  if (failures.length) {
    console.log(`\nErros (${failures.length}):`);
    failures.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
