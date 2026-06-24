/**
 * Re-indexa fotos já carregadas através do InsightFace + pgvector.
 *
 * Útil para fotos carregadas antes da integração (sem embedding 512-D).
 * Lê o ficheiro local de cada foto com key "uploads/...", extrai o embedding
 * e grava-o na coluna pgvector.
 *
 * Uso: DATABASE_URL=... npx tsx scripts/reindex-faces.ts
 */
import prisma from "@/lib/db/prisma";
import { embedImage, storeEmbedding, faceServiceHealthy } from "@/lib/services/insightFaceService";
import { readFile } from "fs/promises";
import path from "path";

(async () => {
  if (!(await faceServiceHealthy())) {
    console.error("❌ face-service offline (porta 8000). Inicie-o primeiro.");
    process.exit(1);
  }

  const photos = await prisma.photo.findMany({
    where: { key: { startsWith: "uploads/" } },
    select: { id: true, key: true, name: true, photographer: { select: { userId: true } } },
  });

  console.log(`A re-indexar ${photos.length} foto(s) local(is)...\n`);

  let indexed = 0;
  let noFace = 0;
  for (const photo of photos) {
    try {
      const filePath = path.join(process.cwd(), "public", photo.key);
      const buffer = await readFile(filePath);
      const emb = await embedImage(buffer, photo.name);
      if (emb.found && emb.embedding) {
        await storeEmbedding(photo.id, photo.photographer.userId, emb.embedding, emb.detScore);
        indexed++;
        console.log(`✓ ${photo.name} (det ${emb.detScore?.toFixed(2)})`);
      } else {
        noFace++;
        console.log(`– ${photo.name}: nenhum rosto detetado`);
      }
    } catch (err) {
      console.log(`✗ ${photo.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nConcluído: ${indexed} indexada(s), ${noFace} sem rosto.`);
  await prisma.$disconnect();
})();
