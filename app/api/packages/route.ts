import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getUserIdFromRequest } from "@/lib/utils/auth";

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  try {
    const bundles = await prisma.photoBundle.findMany({
      where: { eventId },
      include: {
        photos: {
          include: { photo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bundles });
  } catch (err) {
    console.error("GET /api/packages error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bundles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const {
    eventId,
    title,
    description,
    bundlePrice,
    photoIds,
  } = await req.json();

  if (!eventId || !title || !bundlePrice || !photoIds?.length) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { priceEUR: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const originalPrice = event.priceEUR * photoIds.length;
    const discount = originalPrice - bundlePrice;

    const bundle = await prisma.photoBundle.create({
      data: {
        eventId,
        title,
        description,
        originalPrice,
        bundlePrice,
        discount,
        photos: {
          create: photoIds.map((photoId: string) => ({
            photoId,
          })),
        },
      },
      include: {
        photos: {
          include: { photo: true },
        },
      },
    });

    return NextResponse.json({ bundle }, { status: 201 });
  } catch (err) {
    console.error("POST /api/packages error:", err);
    return NextResponse.json(
      { error: "Failed to create bundle" },
      { status: 500 }
    );
  }
}
