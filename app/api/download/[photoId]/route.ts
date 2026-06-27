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
 * Ficheiros locais (dev, key "uploads/...") são servidos diretamente em alta
 * resolução. Em produção com S3, devolve um signed URL. O gate de autorização
 * (pedido COMPLETED do próprio utilizador) é sempre real.
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

    // Resolve o URL do ficheiro em alta resolução
    const key = paidItem.photo.key;
    let fileUrl: string;
    if (key.startsWith("uploads/")) {
      // Ficheiro local (dev): servido a partir de /public
      fileUrl = `/${key}`;
    } else if (!isMockMode()) {
      // Produção: S3 signed URL (validade 1h)
      fileUrl = await getS3SignedUrl(key, 3600);
    } else {
      // Sem ficheiro real nem S3 (fotos seed): placeholder
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
