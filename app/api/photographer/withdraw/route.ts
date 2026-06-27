import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { getPhotographerStats } from "@/lib/services/photographerService";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
});

/**
 * POST /api/photographer/withdraw
 *
 * Pedido de saque do fotógrafo. Não há trilho de pagamento real nem tabela de
 * saques, por isso o pedido é REGISTADO (processamento manual):
 *   - AuditLog (action "withdrawal_requested") — visível no painel admin
 *   - Notification a cada admin (tipo PAYMENT_RECEIVED, o mais próximo no enum)
 *
 * Valida que o montante <= disponível (soma payout 80% das vendas).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = schema.parse(body);

    const photographer = await prisma.photographer.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!photographer) {
      return NextResponse.json(
        { error: "Fotógrafo não encontrado" },
        { status: 404 }
      );
    }

    const stats = await getPhotographerStats(userId);
    const available = stats?.pendingPayout ?? 0;
    // Compara em cêntimos (evita falsos negativos de vírgula flutuante)
    if (Math.round(amount * 100) > Math.round(available * 100)) {
      return NextResponse.json(
        { error: `Montante superior ao disponível (€ ${available.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Registo real do pedido (processamento manual)
    await prisma.auditLog.create({
      data: {
        userId,
        action: "withdrawal_requested",
        resource: "photographer",
        resourceId: photographer.id,
        changes: {
          amount,
          available,
          photographer: photographer.user.name,
          email: photographer.user.email,
        },
      },
    });

    // Notifica os admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "PAYMENT_RECEIVED" as const,
          title: "Pedido de saque",
          message: `${photographer.user.name} solicitou um saque de € ${amount.toFixed(
            2
          )}.`,
          data: { photographerId: photographer.id, amount },
        })),
      });
    }

    return NextResponse.json(
      { ok: true, amount, message: "Pedido de saque registado" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Montante inválido" }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Falha ao solicitar saque";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
