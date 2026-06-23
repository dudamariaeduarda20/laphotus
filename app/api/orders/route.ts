import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { getUserOrders } from "@/lib/services/orderService";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const orders = await getUserOrders(userId);

    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar encomendas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
