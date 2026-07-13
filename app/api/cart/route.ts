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
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.photo.price || 0) * item.quantity;
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
