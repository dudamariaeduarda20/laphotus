import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";

interface ParsedRow {
  number: string;
  athleteName: string;
  athleteEmail: string;
}

/**
 * Parse CSV text -> rows.
 * Expects header: number,athleteName,athleteEmail
 * athleteName and athleteEmail are optional columns.
 */
function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  if (lines.length < 2) {
    return { rows, errors: ["CSV sem linhas de dados"] };
  }

  // Skip header row (first non-empty line)
  const dataLines = lines.slice(1).filter((l) => l.trim() !== "");

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const number = cols[0] || "";
    if (!number) {
      errors.push(`Linha ${i + 2}: número vazio`);
      continue;
    }
    rows.push({
      number,
      athleteName: cols[1] || "",
      athleteEmail: cols[2] || "",
    });
  }

  return { rows, errors };
}

/**
 * POST /api/organizer/bibs
 * Multipart: file (CSV) + eventId (field)
 * Guard: organizador do evento ou admin.
 * Upsert por (eventId, number) — constraint @@unique já existe.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const eventId = (formData.get("eventId") as string | null)?.trim();
    const file = formData.get("file") as File | null;

    if (!eventId) {
      return NextResponse.json({ error: "eventId obrigatório" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "Ficheiro CSV obrigatório" }, { status: 400 });
    }

    // Load event + verify ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organizer: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    }

    const isAdmin = user.role === "ADMIN";
    const isOwner = user.organizer?.id === event.organizerId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Parse CSV
    const text = await file.text();
    const { rows, errors: parseErrors } = parseCsv(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { inserted: 0, updated: 0, errors: parseErrors },
        { status: 400 }
      );
    }

    // Upsert each bib (Prisma upsert on @@unique[eventId, number])
    let inserted = 0;
    let updated = 0;
    const upsertErrors: string[] = [...parseErrors];

    for (const row of rows) {
      try {
        const existing = await prisma.bibNumber.findUnique({
          where: { eventId_number: { eventId, number: row.number } },
        });

        await prisma.bibNumber.upsert({
          where: { eventId_number: { eventId, number: row.number } },
          create: {
            eventId,
            number: row.number,
            athleteName: row.athleteName || null,
            athleteEmail: row.athleteEmail || null,
          },
          update: {
            athleteName: row.athleteName || null,
            athleteEmail: row.athleteEmail || null,
          },
        });

        if (existing) updated++;
        else inserted++;
      } catch (e) {
        upsertErrors.push(
          `Bib ${row.number}: ${e instanceof Error ? e.message : "falha"}`
        );
      }
    }

    return NextResponse.json(
      { inserted, updated, errors: upsertErrors },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/organizer/bibs?eventId=...
 * Lista os bibs de um evento (público — bibs não são dados sensíveis).
 */
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "eventId obrigatório" }, { status: 400 });
    }

    const bibs = await prisma.bibNumber.findMany({
      where: { eventId },
      orderBy: { number: "asc" },
      select: { id: true, number: true, athleteName: true, athleteEmail: true },
    });

    return NextResponse.json({ bibs, total: bibs.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar bibs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
