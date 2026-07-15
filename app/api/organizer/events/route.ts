import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { getUserEvents } from "@/lib/services/eventService";

/**
 * GET /api/organizer/events
 * Lista só os eventos do organizador logado (não a lista pública de eventos).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const events = await getUserEvents(userId);

    return NextResponse.json({ events });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao carregar eventos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
