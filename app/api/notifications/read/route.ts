import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";

/**
 * PATCH /api/notifications/read
 * Marks all unread notifications as read for the current user
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const now = new Date();
    const { count } = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: now },
    });

    return NextResponse.json({ marked: count });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao marcar notificações" }, { status: 500 });
  }
}
