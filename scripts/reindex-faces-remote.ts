/**
 * Re-indexa fotos hospedadas remotamente (Supabase Storage, URLs http) via
 * InsightFace + pgvector.
 *
 * Diferente de reindex-faces.ts (que lê ficheiros locais "uploads/..."), este
 * busca cada foto pelo seu URL público, extrai o embedding 512-D e grava-o na
 * coluna pgvector da FaceIndex.
 *
 * Uso:
 *   FACE_SERVICE_URL=http://127.0.0.1:8000 npx tsx scripts/reindex-faces-remote.ts
 */
import prisma from "@/lib/db/prisma";
import { embedImage, storeEmbedding } from "@/lib/services/insightFaceService";

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://127.0.0.1:8000";

(async () => {
  // Health check direto (não usa faceServiceHealthy: esse exige NODE_ENV=development)
  try {
    const h = await fetch(`${FACE_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!h.ok) throw new Error(`status ${h.status}`);
    const info = await h.json();
    console.log(`✓ face-service OK: ${JSON.stringify(info)}\n`);
  } catch (err) {
    console.error(
      `❌ face-service offline em ${FACE_SERVICE_URL}. Inicie-o primeiro. (${err})`
    );
    process.exit(1);
  }

  const photos = await prisma.photo.findMany({
    where: { key: { startsWith: "http" }, status: "AVAILABLE" },
    select: {
      id: true,
      key: true,
      name: true,
      photographer: { select: { userId: true } },
    },
  });

  console.log(`A re-indexar ${photos.length} foto(s) remota(s)...\n`);

  let indexed = 0;
  let noFace = 0;
  let failed = 0;

  for (const photo of photos) {
    try {
      const res = await fetch(photo.key, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        failed++;
        console.log(`✗ ${photo.name}: fetch ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "image/jpeg";

      const emb = await embedImage(buffer, photo.name, contentType);
      if (emb.found && emb.embedding) {
        await storeEmbedding(
          photo.id,
          photo.photographer.userId,
          emb.embedding,
          emb.detScore
        );
        indexed++;
        console.log(`✓ ${photo.name} (det ${emb.detScore?.toFixed(2)})`);
      } else {
        noFace++;
        console.log(`– ${photo.name}: nenhum rosto detetado`);
      }
    } catch (err) {
      failed++;
      console.log(`✗ ${photo.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(
    `\nConcluído: ${indexed} indexada(s), ${noFace} sem rosto, ${failed} falha(s).`
  );
  await prisma.$disconnect();
})();
