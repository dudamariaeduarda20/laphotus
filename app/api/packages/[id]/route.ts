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
    let eventId: string | null = null;

    // Get the bundle's event
    const existingBundle = await prisma.photoBundle.findUnique({
      where: { id },
      select: { eventId: true },
    });

    if (!existingBundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    eventId = existingBundle.eventId;

    // Get event price
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { priceEUR: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const photoCount = photoIds?.length || 0;
    if (photoCount > 0) {
      originalPrice = event.priceEUR * photoCount;
    } else {
      const existing = await prisma.photoBundle.findUnique({
        where: { id },
        include: { photos: { select: { id: true } } },
      });
      originalPrice = event.priceEUR * (existing?.photos.length || 0);
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
