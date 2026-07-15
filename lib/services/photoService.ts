import prisma from "@/lib/db/prisma";
import { PhotoStatus, UserRole } from "@/lib/types";
import { randomBytes } from "crypto";
import { processPhotoOCR } from "./ocrService";
import { processFaceIndex } from "./faceService";

/**
 * Upload photo (PHOTOGRAPHER, ADMIN only)
 */
export async function uploadPhoto(
  eventId: string,
  photographerId: string,
  fileName: string,
  price: number = 0,
  isPremium: boolean = false,
  userId?: string
) {
  // Verify event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Generate unique filename
  const uniqueName = `${Date.now()}-${randomBytes(8).toString("hex")}-${fileName}`;
  const key = `photos/event-${eventId}/${uniqueName}`;
  const thumbnailKey = `photos/event-${eventId}/thumb-${uniqueName}`;

  const photo = await prisma.photo.create({
    data: {
      eventId,
      photographerId,
      key,
      thumbnailKey,
      name: fileName.replace(/\.[^.]+$/, ""), // Remove extension
      status: PhotoStatus.AVAILABLE,
      price,
      isPremium,
      isWatermarked: true,
      width: 4000,
      height: 2667,
      fileSize: 0, // Will be updated in real upload
      mimeType: "image/jpeg",
    },
    include: { photographer: true },
  });

  // Run OCR + Face indexing in background (don't block upload response)
  processPhotoOCR(photo.id, eventId, fileName).catch((err) => {
    console.error("OCR processing error for photo", photo.id, err);
  });

  if (userId) {
    processFaceIndex(photo.id, userId, fileName).catch((err) => {
      console.error("Face indexing error for photo", photo.id, err);
    });
  }

  // Log upload
  if (userId) {
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
        },
      },
    });
  }

  return photo;
}

/**
 * Get photo by ID
 */
export async function getPhotoById(photoId: string) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      event: true,
      photographer: true,
      favorites: { take: 5 },
    },
  });

  return photo;
}

/**
 * Get photos by event
 */
export async function getPhotosByEvent(eventId: string, limit: number = 100) {
  const photos = await prisma.photo.findMany({
    where: { eventId, status: PhotoStatus.AVAILABLE },
    include: { photographer: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return photos;
}

/**
 * Get photographer's photos
 */
export async function getPhotographerPhotos(photographerId: string) {
  const photos = await prisma.photo.findMany({
    where: { photographerId },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return photos;
}

/**
 * Update photo price/premium status
 */
export async function updatePhoto(
  photoId: string,
  userId: string,
  data: {
    name?: string;
    price?: number;
    isPremium?: boolean;
    status?: PhotoStatus;
  }
) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { photographer: { select: { userId: true } } },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  // Check authorization: photographer owns this photo (userId = User.id) or admin
  if (photo.photographer.userId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== UserRole.ADMIN) {
      throw new Error("Not authorized");
    }
  }

  const updated = await prisma.photo.update({
    where: { id: photoId },
    data,
    include: { photographer: true },
  });

  return updated;
}

/**
 * Delete photo
 */
export async function deletePhoto(photoId: string, userId: string) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { photographer: { select: { userId: true } } },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  // Check authorization: photographer owns this photo or admin
  if (photo.photographer.userId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== UserRole.ADMIN) {
      throw new Error("Not authorized");
    }
  }

  // Never hard-delete a photo that's part of an order — that would cascade-delete
  // the OrderItem (schema: onDelete Cascade) and silently corrupt a buyer's paid
  // order history. Archive instead so it disappears from the shop but stays intact.
  const orderItemCount = await prisma.orderItem.count({ where: { photoId } });
  if (orderItemCount > 0) {
    await prisma.photo.update({
      where: { id: photoId },
      data: { status: PhotoStatus.ARCHIVED },
    });
    return { success: true, archived: true };
  }

  await prisma.photo.delete({
    where: { id: photoId },
  });

  return { success: true, archived: false };
}

/**
 * Add to favorites
 */
export async function addFavorite(userId: string, photoId: string) {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_photoId: { userId, photoId },
    },
  });

  if (existing) {
    throw new Error("Already favorited");
  }

  const favorite = await prisma.favorite.create({
    data: { userId, photoId },
  });

  return favorite;
}

/**
 * Remove favorite
 */
export async function removeFavorite(userId: string, photoId: string) {
  await prisma.favorite.delete({
    where: {
      userId_photoId: { userId, photoId },
    },
  });

  return { success: true };
}

/**
 * Get user favorites
 */
export async function getUserFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: { photo: { include: { photographer: true } } },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((f) => f.photo);
}
