import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/db/prisma";
import { unbanUser } from "@/lib/services/moderationService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params;
    const user = await unbanUser(userId, adminId);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Unban user error:", error);
    return NextResponse.json({ error: "Falha ao desbanir utilizador" }, { status: 500 });
  }
}
