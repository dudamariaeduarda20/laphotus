import prisma from "@/lib/db/prisma";

/**
 * Real gate: does this user have a COMPLETED order containing this photo?
 * Same check used by the paid-download flow (/api/download/[photoId]).
 */
export async function hasVerifiedPurchase(userId: string, photoId: string): Promise<boolean> {
  const paidItem = await prisma.orderItem.findFirst({
    where: { photoId, order: { userId, status: "COMPLETED" } },
    select: { id: true },
  });
  return !!paidItem;
}

export async function createOrUpdateReview(
  userId: string,
  photoId: string,
  rating: number,
  comment?: string
) {
  const verified = await hasVerifiedPurchase(userId, photoId);
  if (!verified) {
    throw new Error("Só quem comprou a foto pode avaliar");
  }

  // Upsert — one review per user per photo. Editing resets to pending:
  // content changed, so it needs a fresh moderation pass before counting
  // toward the public average again.
  const review = await prisma.review.upsert({
    where: { userId_photoId: { userId, photoId } },
    create: { userId, photoId, rating, comment, status: "pending" },
    update: { rating, comment, status: "pending" },
  });

  return review;
}

export async function deleteOwnReview(userId: string, photoId: string) {
  const review = await prisma.review.findUnique({
    where: { userId_photoId: { userId, photoId } },
  });
  if (!review) {
    throw new Error("Avaliação não encontrada");
  }
  await prisma.review.delete({ where: { id: review.id } });
  return { success: true };
}

export interface PhotoReviewsResult {
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    user: { name: string };
  }>;
  averageRating: number;
  reviewCount: number;
  ownReview: { id: string; rating: number; comment: string | null; status: string } | null;
  canReview: boolean;
}

export async function getPhotoReviews(
  photoId: string,
  viewerUserId?: string | null
): Promise<PhotoReviewsResult> {
  const [approved, agg, ownReview, canReview] = await Promise.all([
    prisma.review.findMany({
      where: { photoId, status: "approved" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.review.aggregate({
      where: { photoId, status: "approved" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    viewerUserId
      ? prisma.review.findUnique({
          where: { userId_photoId: { userId: viewerUserId, photoId } },
          select: { id: true, rating: true, comment: true, status: true },
        })
      : Promise.resolve(null),
    viewerUserId ? hasVerifiedPurchase(viewerUserId, photoId) : Promise.resolve(false),
  ]);

  return {
    reviews: approved,
    averageRating: agg._avg.rating || 0,
    reviewCount: agg._count._all,
    ownReview,
    canReview,
  };
}

export interface ReviewSummary {
  photoId: string;
  averageRating: number;
  reviewCount: number;
}

/** Batch average+count for a set of photos (approved only) — one grouped
 * query for the whole grid, not one query per card. */
export async function getReviewSummaries(photoIds: string[]): Promise<Map<string, ReviewSummary>> {
  if (photoIds.length === 0) return new Map();

  const groups = await prisma.review.groupBy({
    by: ["photoId"],
    where: { photoId: { in: photoIds }, status: "approved" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const map = new Map<string, ReviewSummary>();
  for (const g of groups) {
    map.set(g.photoId, {
      photoId: g.photoId,
      averageRating: g._avg.rating || 0,
      reviewCount: g._count._all,
    });
  }
  return map;
}

// ==================== MODERATION (admin) ====================

export async function listReviewsForModeration(status?: string) {
  return prisma.review.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { select: { name: true, email: true } },
      photo: { select: { id: true, name: true, thumbnailKey: true, key: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveReview(reviewId: string, adminId: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "approved" },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "review_approved", resource: "review", resourceId: reviewId },
  });

  return review;
}

export async function rejectReview(reviewId: string, adminId: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "rejected" },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "review_rejected", resource: "review", resourceId: reviewId },
  });

  return review;
}
