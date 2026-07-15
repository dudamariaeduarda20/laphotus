import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import {
  getPhotographerStats,
  getPhotographerEvents,
} from "@/lib/services/photographerService";

/**
 * GET /api/photographer/sales
 * Dashboard de vendas: totais, série dos últimos 30 dias e últimas 10 vendas.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const [stats, eventsResult] = await Promise.all([
      getPhotographerStats(userId),
      getPhotographerEvents(userId),
    ]);

    if (!stats || !eventsResult) {
      return NextResponse.json(
        { error: "Fotógrafo não encontrado" },
        { status: 404 }
      );
    }

    // Running total over the last 30 days, for the cumulative earnings chart
    let running = 0;
    const cumulative = stats.salesByDay.map((d) => {
      running += d.revenue;
      return { date: d.date, total: running };
    });

    return NextResponse.json({
      totalRevenue: stats.totalRevenue,
      totalSales: stats.totalSales,
      photosForSale: stats.photosForSale,
      eventsCount: stats.eventsCount,
      thisMonth: stats.thisMonth,
      salesByDay: stats.salesByDay,
      cumulative,
      recentSales: eventsResult.recentSales.slice(0, 10),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao carregar vendas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
