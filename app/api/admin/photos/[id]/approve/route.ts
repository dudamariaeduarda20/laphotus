import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/db/prisma";
import { approvePhoto } from "@/lib/services/moderationService";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromRequest(request);
    if (!adminId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await params;
    const { photo, emailResult } = await approvePhoto(id, adminId);

    return NextResponse.json({ success: true, photo, emailResult });
  } catch (error) {
    console.error("Approve photo error:", error);
    return NextResponse.json({ error: "Falha ao aprovar foto" }, { status: 500 });
  }
}
