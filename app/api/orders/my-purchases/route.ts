import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

// GET /api/orders/my-purchases?dateFrom=&dateTo=&eventId=&photographerId=
// Lists the logged-in user's completed purchases, optionally filtered.
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const eventId = searchParams.get("eventId");
    const photographerId = searchParams.get("photographerId");

    const where: Prisma.OrderWhereInput = {
      userId,
      status: "COMPLETED",
    };

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
      };
    }

    if (eventId || photographerId) {
      where.items = {
        some: {
          photo: {
            ...(eventId ? { eventId } : {}),
            ...(photographerId ? { photographerId } : {}),
          },
        },
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            photo: {
              include: {
                event: { select: { id: true, title: true } },
                photographer: {
                  include: { user: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      totalPhotos: orders.reduce((sum, order) => sum + order.items.length, 0),
    };

    return NextResponse.json({ orders, summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao carregar compras";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
