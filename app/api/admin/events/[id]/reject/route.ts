import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/db/prisma";
import { rejectEvent } from "@/lib/services/moderationService";
import { z } from "zod";

const rejectSchema = z.object({ reason: z.string().min(3) });

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

    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

    const { id } = await params;
    const { event, emailResult } = await rejectEvent(id, adminId, reason);

    return NextResponse.json({ success: true, event, emailResult });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Motivo obrigatório (mín. 3 caracteres)" },
        { status: 400 }
      );
    }
    console.error("Reject event error:", error);
    return NextResponse.json({ error: "Falha ao rejeitar evento" }, { status: 500 });
  }
}
