import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { getPhotographerEvents } from "@/lib/services/photographerService";

/**
 * GET /api/photographer/events
 * Eventos onde o fotógrafo logado tem fotos + histórico de vendas por foto.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const result = await getPhotographerEvents(userId);
    if (!result) {
      return NextResponse.json(
        { error: "Fotógrafo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao carregar eventos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
