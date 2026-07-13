import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ZipArchive } from "archiver";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json(
        { error: "orderId obrigatório" },
        { status: 400 }
      );
    }

    // Verify order ownership + status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { photo: true } } },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (order.userId !== userId) {
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

    // Create download record
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry
    await prisma.download.create({
      data: {
        userId,
        orderId,
        expiresAt,
      },
    });

    // Generate ZIP stream
    const archive = new ZipArchive({ zlib: { level: 6 } });

    // Collect photos and generate presigned URLs
    const photos = order.items.map((item) => item.photo);

    for (const photo of photos) {
      if (!photo.key) continue;

      try {
        const signedUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET || "laphotus-dev",
            Key: photo.key,
          }),
          { expiresIn: 3600 }
        );

        // Fetch from S3 and add to archive
        const response = await fetch(signedUrl);
        if (!response.ok) continue;

        const buffer = await response.arrayBuffer();
        const filename = `${photo.name || photo.id}.jpg`;

        archive.append(Buffer.from(buffer), { name: filename });
      } catch (error) {
        console.error(`Failed to add photo ${photo.id} to ZIP:`, error);
        continue;
      }
    }

    await archive.finalize();

    // Return as response stream
    return new NextResponse(archive as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="order-${orderId}.zip"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
