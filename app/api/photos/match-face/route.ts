import { NextRequest, NextResponse } from "next/server";
import { matchFaceInEvent } from "@/lib/services/faceService";
import { z } from "zod";

const matchSchema = z.object({
  eventId: z.string().min(1),
  fileName: z.string().min(1),
});

/**
 * POST /api/photos/match-face
 * Recebe selfie, compara com fotos do evento
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;
    const fileName = formData.get("fileName") as string;

    // Validação básica
    if (!file || !eventId || !fileName) {
      return NextResponse.json(
        { error: "Ficheiro, evento e nome obrigatórios" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Apenas imagens permitidas" },
        { status: 400 }
      );
    }

    // Processa selfie - gera vetor facial + busca matches
    const matches = await matchFaceInEvent(eventId, fileName, 0.7);

    if (matches.length === 0) {
      return NextResponse.json(
        {
          matches: [],
          message: "Sem correspondências encontradas para esta selfie",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        matches,
        summary: {
          total: matches.length,
          bestMatch: matches[0]?.matchPercent || 0,
          averageMatch:
            Math.round(
              (matches.reduce((sum, m) => sum + m.matchPercent, 0) /
                matches.length) *
                10
            ) / 10,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Match face error:", error);
    return NextResponse.json(
      { error: "Falha ao processar selfie" },
      { status: 500 }
    );
  }
}
