import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { getPhotographerStats } from "@/lib/services/photographerService";

/**
 * GET /api/photographer/stats
 * Estatísticas de vendas do fotógrafo logado (cards + gráfico do dashboard).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const stats = await getPhotographerStats(userId);
    if (!stats) {
      return NextResponse.json(
        { error: "Fotógrafo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ stats });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao carregar estatísticas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
