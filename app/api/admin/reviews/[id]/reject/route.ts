import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/db/prisma";
import { rejectReview } from "@/lib/services/reviewService";

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
    const review = await rejectReview(id, adminId);
    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Reject review error:", error);
    return NextResponse.json({ error: "Falha ao rejeitar avaliação" }, { status: 500 });
  }
}
