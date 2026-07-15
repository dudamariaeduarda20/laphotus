import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");
    const orderId = searchParams.get("orderId");

    if (!photoId || !orderId) {
      return NextResponse.json(
        { error: "photoId e orderId obrigatórios" },
        { status: 400 }
      );
    }

    // Verify user owns the order and it's completed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { photoId },
          include: { photo: { select: { key: true } } },
        },
      },
    });

    if (!order || order.userId !== userId) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    if (order.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Pedido não foi pago" },
        { status: 400 }
      );
    }

    const photoKey = order.items[0]?.photo.key;
    if (!photoKey) {
      return NextResponse.json(
        { error: "Foto não encontrada" },
        { status: 404 }
      );
    }

    // Photos live in Supabase Storage (public URL saved as key) or,
    // for older/seed data, a raw S3 object key — resolve accordingly.
    if (photoKey.startsWith("http://") || photoKey.startsWith("https://")) {
      return NextResponse.json({ url: photoKey });
    }

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || "laphotus-dev",
        Key: photoKey,
      }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
