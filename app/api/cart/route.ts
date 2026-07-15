import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartItems = await prisma.cart.findMany({
      where: { userId: userId },
      include: {
        photo: {
          select: {
            id: true,
            name: true,
            thumbnailKey: true,
            key: true,
            event: {
              select: {
                id: true,
                priceEUR: true,
              },
            },
          },
        },
        bundle: {
          select: {
            id: true,
            title: true,
            bundlePrice: true,
            originalPrice: true,
            discount: true,
            photos: {
              include: {
                photo: {
                  select: {
                    thumbnailKey: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals (use captured price or fetch from event)
    const total = cartItems.reduce((sum, item) => {
      if (item.photoId && item.photo) {
        const price = item.price ?? item.photo.event.priceEUR ?? 0;
        return sum + price * item.quantity;
      }
      if (item.bundleId && item.bundle) {
        return sum + item.bundle.bundlePrice * item.quantity;
      }
      return sum;
    }, 0);

    return NextResponse.json({
      success: true,
      cartItems,
      total,
      count: cartItems.length,
    });
  } catch (error) {
    console.error("[cart] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
