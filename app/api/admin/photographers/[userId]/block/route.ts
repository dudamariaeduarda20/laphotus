import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { UserRole } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminId = getUserIdFromRequest(request);
    if (!adminId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (admin?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "photographer_blocked",
        resource: "photographer",
        resourceId: (await params).userId,
      },
    });

    return NextResponse.json({ success: true, message: "Fotógrafo bloqueado" });
  } catch (error) {
    console.error("Block error:", error);
    return NextResponse.json(
      { error: "Falha ao bloquear" },
      { status: 500 }
    );
  }
}
