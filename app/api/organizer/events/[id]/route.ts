import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import {
  getOrganizerEventDetail,
  OrganizerEventDetail,
} from "@/lib/services/organizerService";

function toCsv(detail: OrganizerEventDetail): string {
  const header = ["Encomenda", "Data", "Comprador", "Email", "Itens", "Total (EUR)", "Estado"];
  const rows = detail.orders.map((o) => [
    o.orderId,
    new Date(o.createdAt).toISOString(),
    o.buyerName,
    o.buyerEmail,
    String(o.itemCount),
    o.total.toFixed(2),
    o.status,
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

/**
 * GET /api/organizer/events/[id]
 * Painel de faturamento, ranking de fotógrafos e pedidos de um evento do organizador.
 * ?days=30|60|90  ?status=COMPLETED  ?from=ISO  ?to=ISO  ?format=csv
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysRaw = parseInt(searchParams.get("days") || "30");
    const days = ([30, 60, 90] as const).includes(daysRaw as 30 | 60 | 90)
      ? (daysRaw as 30 | 60 | 90)
      : 30;
    const status = searchParams.get("status") || undefined;
    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");
    const from = fromRaw ? new Date(fromRaw) : undefined;
    const to = toRaw ? new Date(toRaw) : undefined;
    const format = searchParams.get("format");

    const { id } = await params;
    const detail = await getOrganizerEventDetail(userId, id, {
      days,
      status,
      from: from && !isNaN(from.getTime()) ? from : undefined,
      to: to && !isNaN(to.getTime()) ? to : undefined,
    });

    if (detail === null) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }
    if (detail === "forbidden") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    if (format === "csv") {
      return new NextResponse(toCsv(detail), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="vendas-${id}.csv"`,
        },
      });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Organizer event detail error:", error);
    return NextResponse.json(
      { error: "Falha ao carregar painel do evento" },
      { status: 500 }
    );
  }
}
