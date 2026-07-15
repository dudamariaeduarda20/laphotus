import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/db/prisma";
import { getPlatformAnalytics } from "@/lib/services/adminAnalyticsService";

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

    const analytics = await getPlatformAnalytics();

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Falha ao carregar estatísticas" },
      { status: 500 }
    );
  }
}
