import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { UserRole } from "@/lib/types";

/**
 * GET /api/admin/photographers
 * Lista todos fotógrafos com stats reais
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const photographers = await prisma.photographer.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { totalSales: "desc" },
    });

    const result = photographers.map((p) => ({
      user: p.user,
      photoCount: p._count.photos,
      rating: p.rating,
      totalSales: p.totalSales,
      totalRevenue: p.totalRevenue,
      active: p.active,
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
