import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoId, bundleId, quantity = 1 } = await req.json();

    if (!photoId && !bundleId) {
      return NextResponse.json(
        { error: "photoId or bundleId is required" },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: "quantity must be >= 1" },
        { status: 400 }
      );
    }

    if (photoId) {
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
        include: { event: { select: { priceEUR: true } } },
      });

      if (!photo) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }

      // Capture event price at time of adding to cart
      const price = photo.event.priceEUR;

      const cartItem = await prisma.cart.upsert({
        where: { userId_photoId: { userId: userId, photoId } },
        update: { quantity: { increment: quantity } },
        create: { userId: userId, photoId, quantity, price },
        include: {
          photo: {
            select: {
              id: true,
              name: true,
              thumbnailKey: true,
              eventId: true,
            },
          },
        },
      });

      return NextResponse.json({ success: true, cartItem, price });
    }

    if (bundleId) {
      const bundle = await prisma.photoBundle.findUnique({
        where: { id: bundleId },
        select: { id: true, bundlePrice: true, title: true },
      });

      if (!bundle) {
        return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
      }

      const cartItem = await prisma.cart.upsert({
        where: { userId_bundleId: { userId: userId, bundleId } },
        update: { quantity: { increment: quantity } },
        create: { userId: userId, bundleId, quantity },
        include: {
          bundle: {
            select: {
              id: true,
              title: true,
              bundlePrice: true,
              discount: true,
            },
          },
        },
      });

      return NextResponse.json({ success: true, cartItem });
    }
  } catch (error) {
    console.error("[cart/add] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
