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
            price: true,
            thumbnailKey: true,
            key: true,
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

    // Calculate totals
    const total = cartItems.reduce((sum, item) => {
      if (item.photoId && item.photo) {
        return sum + (item.photo.price || 0) * item.quantity;
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
