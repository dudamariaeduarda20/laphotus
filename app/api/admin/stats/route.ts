import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, requireRole } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { UserRole } from "@/lib/types";

/**
 * GET /api/admin/stats
 * Retorna estatísticas globais da plataforma
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Stats globais
    const totalUsers = await prisma.user.count();
    const photographers = await prisma.photographer.count();
    const totalPhotos = await prisma.photo.count();
    const transactions = await prisma.transaction.findMany({
      where: { status: "completed" },
    });

    const platformEarnings = transactions.reduce((sum, t) => sum + t.commission, 0);
    const transactionCount = transactions.length;

    // Audit logs recentes
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        photographersCount: photographers,
        totalPhotos,
        platformEarnings,
        transactionCount,
      },
      logs: logs.map((log) => ({
        ...log,
        userName: log.user?.name || "System",
        userEmail: log.user?.email || "",
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
