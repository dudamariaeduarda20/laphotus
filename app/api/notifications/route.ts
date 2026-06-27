import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";

/**
 * GET /api/notifications
 * Returns recent notifications for the authenticated user (unread first, limit 20)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
      },
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao carregar notificações" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications/read
 * Not handled here — see /api/notifications/read/route.ts
 */
