import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { updateCommissionRate, getPlatformEarnings, getCommissionHistory, getCommissionRate } from "@/lib/services/settingsService";
import prisma from "@/lib/db/prisma";
import { UserRole } from "@/lib/types";
import { z } from "zod";

const updateSchema = z.object({
  commissionRate: z.number().min(0).max(1),
});

/**
 * GET /api/admin/settings
 * Retorna configurações e histórico de comissões
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

    const [commissionRate, earnings, history] = await Promise.all([
      getCommissionRate(),
      getPlatformEarnings(),
      getCommissionHistory(),
    ]);

    return NextResponse.json({
      commissionRate,
      earnings,
      history,
    });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar configurações" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Atualiza taxa de comissão
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const updated = await updateCommissionRate(validated.commissionRate, userId);

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validação falhou", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Falha ao atualizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
