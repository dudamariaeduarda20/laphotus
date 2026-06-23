import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, requireRole } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { UserRole } from "@/lib/types";

/**
 * GET /api/admin/photographers
 * Lista todos fotógrafos com stats
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

    // Buscar fotógrafos
    const photographers = await prisma.photographer.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        photos: true,
      },
      orderBy: { totalSales: "desc" },
    });

    const result = photographers.map((p) => ({
      user: p.user,
      photoCount: p.photos.length,
      rating: p.rating,
      totalSales: p.totalSales,
      totalRevenue: p.totalRevenue,
      approved: true, // Mockado - em produção seria um flag
      blocked: false,
    }));

    return NextResponse.json({ photographers: result });
  } catch (error) {
    console.error("Photographers list error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar fotógrafos" },
      { status: 500 }
    );
  }
}
