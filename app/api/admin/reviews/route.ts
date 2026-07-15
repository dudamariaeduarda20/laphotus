import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/db/prisma";
import { listReviewsForModeration } from "@/lib/services/reviewService";

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

    const reviews = await listReviewsForModeration(status);
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("List reviews for moderation error:", error);
    return NextResponse.json({ error: "Falha ao carregar avaliações" }, { status: 500 });
  }
}
