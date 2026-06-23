import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { getS3SignedUrl, isMockMode } from "@/lib/services/s3Service";

/**
 * GET /api/download/[photoId]
 *
 * Gated download. Releases the full-resolution, watermark-free file ONLY if
 * the requesting user owns a COMPLETED (paid) order containing this photo.
 *
 * Real file storage (S3 signed URL) plugs in at the marked spot — see
 * DEPLOY.md. Until then we redirect to the stored key as a stand-in, but the
 * authorization gate below is fully real.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { photoId } = await params;

    // Real gate: does this user have a PAID order with this photo?
    const paidItem = await prisma.orderItem.findFirst({
      where: {
        photoId,
        order: {
          userId,
          status: "COMPLETED",
        },
      },
      include: {
        order: { select: { id: true } },
        photo: { select: { id: true, name: true, key: true } },
      },
    });

    if (!paidItem) {
      return NextResponse.json(
        { error: "Sem compra paga para esta foto" },
        { status: 403 }
      );
    }

    // Mark order as downloaded (audit trail)
    await prisma.order.update({
      where: { id: paidItem.order.id },
      data: { downloadedAt: new Date() },
    });

    // Generate S3 signed URL (real file, 1-hour validity)
    let fileUrl: string;
    if (!isMockMode()) {
      fileUrl = await getS3SignedUrl(paidItem.photo.key, 3600);
    } else {
      // Fallback placeholder (no S3 creds)
      fileUrl = `https://via.placeholder.com/4000x2667.jpg?text=${encodeURIComponent(
        paidItem.photo.name
      )}`;
    }

    return NextResponse.json({
      ok: true,
      photoId: paidItem.photo.id,
      name: paidItem.photo.name,
      url: fileUrl,
      watermarked: false,
      resolution: "4000x2667",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao descarregar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
