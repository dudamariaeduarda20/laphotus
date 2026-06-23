import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { UserRole } from "@/lib/types";

/**
 * GET /api/admin/audit-logs
 * Retorna logs de auditoria com filtros
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const resource = searchParams.get("resource");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        userName: log.user?.name || "System",
        userEmail: log.user?.email || "",
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Audit logs error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar logs" },
      { status: 500 }
    );
  }
}
