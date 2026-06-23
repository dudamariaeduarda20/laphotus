import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { getCommissionRate } from "@/lib/services/settingsService";
import prisma from "@/lib/db/prisma";

/**
 * GET /api/photographer/earnings
 * Real earnings for the logged-in photographer: sum of payouts (80% share)
 * from completed transactions, plus this-month total and full history.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const photographer = await prisma.photographer.findUnique({
      where: { userId },
    });
    if (!photographer) {
      return NextResponse.json(
        { error: "Fotógrafo não encontrado" },
        { status: 404 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: { photographerId: photographer.id, status: "completed" },
      orderBy: { createdAt: "desc" },
    });

    const totalEarnings = transactions.reduce(
      (s, t) => s + t.photographerPayout,
      0
    );

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const thisMonth = transactions
      .filter((t) => t.createdAt >= monthStart)
      .reduce((s, t) => s + t.photographerPayout, 0);
    const thisYear = transactions
      .filter((t) => t.createdAt >= yearStart)
      .reduce((s, t) => s + t.photographerPayout, 0);

    const commissionRate = await getCommissionRate();

    return NextResponse.json({
      totalEarnings,
      totalOrders: transactions.length,
      thisMonth,
      thisYear,
      commissionRate,
      payoutShare: 1 - commissionRate,
      transactions,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao carregar ganhos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
