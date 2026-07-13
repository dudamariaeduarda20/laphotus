import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoId, quantity = 1 } = await req.json();

    if (!photoId) {
      return NextResponse.json(
        { error: "photoId is required" },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: "quantity must be >= 1" },
        { status: 400 }
      );
    }

    // Verify photo exists
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      select: { id: true, price: true },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Upsert cart item (add or increase quantity)
    const cartItem = await prisma.cart.upsert({
      where: { userId_photoId: { userId: userId, photoId } },
      update: { quantity: { increment: quantity } },
      create: { userId: userId, photoId, quantity },
      include: {
        photo: {
          select: {
            id: true,
            name: true,
            price: true,
            thumbnailKey: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      cartItem,
    });
  } catch (error) {
    console.error("[cart/add] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
