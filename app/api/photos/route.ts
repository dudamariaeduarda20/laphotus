import { NextRequest, NextResponse } from "next/server";
import { getPhotosByEvent, uploadPhoto } from "@/lib/services/photoService";
import { searchPhotosByBibNumber } from "@/lib/services/ocrService";
import { getUserIdFromRequest, requireRole } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { uploadToS3, isMockMode } from "@/lib/services/s3Service";
import { storageEnabled, uploadToStorage } from "@/lib/services/supabaseStorage";
import { getReviewSummaries } from "@/lib/services/reviewService";

const uploadSchema = z.object({
  eventId: z.string().min(1),
  fileName: z.string().min(3),
  isPremium: z.boolean().optional(),
});

/**
 * GET /api/photos - Get photos by event, own photos, or search by bib number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const bibNumber = searchParams.get("bibNumber");
    const own = searchParams.get("own");
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const sortBy = (searchParams.get("sortBy") || "newest") as
      | "newest"
      | "price-asc"
      | "price-desc";

    let photos;

    if (own) {
      // Get photographer's own photos
      const userId = getUserIdFromRequest(request);
      if (!userId) {
        return NextResponse.json(
          { error: "Não autenticado" },
          { status: 401 }
        );
      }

      const photographer = await prisma.photographer.findUnique({
        where: { userId },
      });

      if (!photographer) {
        return NextResponse.json(
          { error: "Fotógrafo não encontrado" },
          { status: 404 }
        );
      }

      photos = await prisma.photo.findMany({
        where: { photographerId: photographer.id },
        include: {
          photographer: true,
          event: { select: { id: true, title: true, sport: true } },
          _count: {
            select: {
              orderItems: { where: { order: { status: "COMPLETED" } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (eventId) {
      if (bibNumber) {
        // Search by bib number — exact match via real PhotoBib join
        photos = await searchPhotosByBibNumber(eventId, bibNumber);
      } else {
        // Get photos from event with price + sort filters
        photos = await getPhotosByEvent(
          eventId,
          100,
          minPrice,
          maxPrice,
          sortBy
        );
      }

      // One grouped query for the whole grid's review averages — not one
      // fetch per card.
      const summaries = await getReviewSummaries(photos.map((p) => p.id));
      photos = photos.map((p) => ({
        ...p,
        averageRating: summaries.get(p.id)?.averageRating || 0,
        reviewCount: summaries.get(p.id)?.reviewCount || 0,
      }));
    } else {
      return NextResponse.json(
        { error: "eventId obrigatório" },
        { status: 400 }
      );
    }

    return NextResponse.json({ photos });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Falha ao buscar fotos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/photos - Upload photo with real file to S3
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse FormData (real file upload)
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;
    const fileName = formData.get("fileName") as string;
    const price = parseFloat((formData.get("price") as string) || "0");
    const isPremium = formData.get("isPremium") === "true";
    // Descritor facial REAL (128-D) extraído no browser via face-api.js
    const faceDescriptorRaw = formData.get("faceDescriptor") as string | null;

    if (!file || !eventId || !fileName) {
      return NextResponse.json(
        { error: "File, eventId, and fileName required" },
        { status: 400 }
      );
    }

    // Verify user is photographer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { photographer: true },
    });

    if (!user?.photographer) {
      return NextResponse.json(
        { error: "Only photographers can upload" },
        { status: 403 }
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Armazenamento (prioridade): Supabase Storage → S3 → local (dev).
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    let s3Result = { key: "", fileSize: 0 };
    if (storageEnabled()) {
      // Produção: Supabase Storage (bucket "fotos"). `key` = URL pública.
      const r = await uploadToStorage(
        `event-${eventId}/${Date.now()}-${safeName}`,
        buffer,
        file.type
      );
      s3Result = { key: r.key, fileSize: r.fileSize };
    } else if (!isMockMode()) {
      s3Result = await uploadToS3(
        `photos/event-${eventId}/${Date.now()}-${fileName}`,
        buffer,
        file.type
      );
    } else {
      // Mock mode (dev local): grava o ficheiro real em public/uploads/
      // para que a imagem apareça mesmo sem S3.
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");
      const storedName = `${Date.now()}-${safeName}`;
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, storedName), buffer);
      // key servível diretamente pelo Next a partir de /public
      s3Result = {
        key: `uploads/${storedName}`,
        fileSize: buffer.length,
      };
    }

    // Save to DB with real file metadata
    const photo = await prisma.photo.create({
      data: {
        eventId,
        photographerId: user.photographer.id,
        key: s3Result.key,
        thumbnailKey: s3Result.key + "-thumb",
        name: fileName.replace(/\.[^.]+$/, ""),
        status: "AVAILABLE",
        isPremium,
        isWatermarked: true,
        width: 4000,
        height: 2667,
        fileSize: s3Result.fileSize,
        mimeType: file.type || "image/jpeg",
      },
      include: { photographer: true },
    });

    // Run OCR in background (don't block)
    const { processPhotoOCR } = await import("@/lib/services/ocrService");

    processPhotoOCR(photo.id, eventId, fileName).catch((err) => {
      console.error("OCR error for", photo.id, err);
    });

    // Indexação facial. Motor de identity matching (prioridade):
    //   1. AWS Rekognition — IndexFaces real (creds presentes)
    //   2. InsightFace + pgvector — embeddings reais (face-service ativo)
    //   3. face-api.js — descritor 128-D extraído no browser
    //
    // NOTA: Google Cloud Vision NÃO faz identity matching (só deteta rostos),
    // por isso não é usado para indexação. Ver lib/services/googleVisionService.
    try {
      const { awsEnabled, indexFaceByBytes } = await import(
        "@/lib/services/faceService"
      );
      if (awsEnabled()) {
        await indexFaceByBytes(photo.id, userId, buffer);
      } else {
        const { embedImage, storeEmbedding, faceServiceHealthy } = await import(
          "@/lib/services/insightFaceService"
        );
        if (await faceServiceHealthy()) {
          const emb = await embedImage(buffer, fileName, file.type);
          if (emb.found && emb.embedding) {
            await storeEmbedding(photo.id, userId, emb.embedding, emb.detScore);
          }
        } else if (faceDescriptorRaw) {
          const descriptor = JSON.parse(faceDescriptorRaw);
          if (Array.isArray(descriptor) && descriptor.length === 128) {
            const { storeFaceDescriptor } = await import(
              "@/lib/services/faceService"
            );
            await storeFaceDescriptor(photo.id, userId, descriptor);
          }
        }
      }
    } catch (err) {
      console.error("Indexação facial falhou para", photo.id, err);
    }

    // Cluster faces in event (group same person's variations)
    try {
      const { clusterFacesByEventId } = await import(
        "@/lib/services/faceService"
      );
      await clusterFacesByEventId(eventId);
    } catch (err) {
      console.error("Agrupamento facial falhou para evento", eventId, err);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "photo_uploaded",
        resource: "photo",
        resourceId: photo.id,
        changes: {
          fileName,
          eventId,
          price,
          isPremium,
          fileSize: s3Result.fileSize,
        },
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
