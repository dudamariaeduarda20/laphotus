import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getUserIdFromRequest } from "@/lib/utils/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const { title, description, bundlePrice, photoIds } = await req.json();

  try {
    let originalPrice: number = 0;

    if (photoIds && photoIds.length > 0) {
      const photos = await prisma.photo.findMany({
        where: { id: { in: photoIds } },
      });
      originalPrice = photos.reduce((sum, p) => sum + (p.price || 0), 0);
    } else {
      const existing = await prisma.photoBundle.findUnique({
        where: { id },
        include: { photos: { include: { photo: true } } },
      });
      originalPrice = existing?.photos.reduce(
        (sum, bp) => sum + (bp.photo.price || 0),
        0
      ) || 0;
    }

    const discount = originalPrice - (bundlePrice || 0);

    const bundle = await prisma.photoBundle.update({
      where: { id },
      data: {
        title,
        description,
        bundlePrice,
        originalPrice,
        discount,
        ...(photoIds && {
          photos: {
            deleteMany: {},
            create: photoIds.map((photoId: string) => ({ photoId })),
          },
        }),
      },
      include: {
        photos: {
          include: { photo: true },
        },
      },
    });

    return NextResponse.json({ bundle });
  } catch (err) {
    console.error("PATCH /api/packages error:", err);
    return NextResponse.json(
      { error: "Failed to update bundle" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.photoBundle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/packages error:", err);
    return NextResponse.json(
      { error: "Failed to delete bundle" },
      { status: 500 }
    );
  }
}
