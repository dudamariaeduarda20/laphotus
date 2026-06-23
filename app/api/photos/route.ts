import { NextRequest, NextResponse } from "next/server";
import { getPhotosByEvent, uploadPhoto } from "@/lib/services/photoService";
import { searchPhotosByBibNumber } from "@/lib/services/ocrService";
import { getUserIdFromRequest, requireRole } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { uploadToS3, isMockMode } from "@/lib/services/s3Service";

const uploadSchema = z.object({
  eventId: z.string().min(1),
  fileName: z.string().min(3),
  price: z.number().min(0).optional(),
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
        include: { photographer: true },
        orderBy: { createdAt: "desc" },
      });
    } else if (eventId) {
      if (bibNumber) {
        // Search by bib number — exact match via real PhotoBib join
        photos = await searchPhotosByBibNumber(eventId, bibNumber);
      } else {
        // Get all photos from event
        photos = await getPhotosByEvent(eventId);
      }
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

    // Upload to S3 (or mock if no AWS creds)
    let s3Result = { key: "", fileSize: 0 };
    if (!isMockMode()) {
      s3Result = await uploadToS3(
        `photos/event-${eventId}/${Date.now()}-${fileName}`,
        buffer,
        file.type
      );
    } else {
      // Mock mode: fake S3 key
      s3Result = {
        key: `photos/event-${eventId}/${Date.now()}-${fileName}`,
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
        price,
        isPremium,
        isWatermarked: true,
        width: 4000,
        height: 2667,
        fileSize: s3Result.fileSize,
        mimeType: file.type || "image/jpeg",
      },
      include: { photographer: true },
    });

    // Run OCR + Face indexing in background (don't block)
    const { processPhotoOCR } = await import("@/lib/services/ocrService");
    const { processFaceIndex } = await import("@/lib/services/faceService");

    processPhotoOCR(photo.id, eventId, fileName).catch((err) => {
      console.error("OCR error for", photo.id, err);
    });

    processFaceIndex(photo.id, userId, fileName).catch((err) => {
      console.error("Face index error for", photo.id, err);
    });

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
