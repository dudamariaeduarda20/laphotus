import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/db/prisma";
import { listEventsForModeration } from "@/lib/services/moderationService";

export async function GET(request: NextRequest) {
  try {
    const adminId = getUserIdFromRequest(request);
    if (!adminId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const events = await listEventsForModeration(status);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("List events for moderation error:", error);
    return NextResponse.json({ error: "Falha ao carregar eventos" }, { status: 500 });
  }
}
