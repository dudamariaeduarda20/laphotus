import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { quantity } = await req.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "quantity must be >= 1" },
        { status: 400 }
      );
    }

    // Verify ownership
    const cartItem = await prisma.cart.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    if (cartItem.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update quantity
    const updated = await prisma.cart.update({
      where: { id },
      data: { quantity },
      include: {
        photo: {
          select: {
            id: true,
            name: true,
            thumbnailKey: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      cartItem: updated,
    });
  } catch (error) {
    console.error("[cart/update] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const cartItem = await prisma.cart.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    if (cartItem.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete
    await prisma.cart.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Cart item deleted",
    });
  } catch (error) {
    console.error("[cart/delete] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
