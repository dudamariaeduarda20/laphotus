import { NextRequest, NextResponse } from "next/server";
import {
  matchFaceByDescriptor,
  matchFaceInEvent,
} from "@/lib/services/faceService";

/**
 * POST /api/photos/match-face
 *
 * Reconhecimento facial REAL. O browser (face-api.js) extrai o descritor 128-D
 * da selfie e envia-o em JSON. O servidor compara por distância euclidiana
 * contra os descritores reais guardados no evento.
 *
 * Fallback: se vier só o nome do ficheiro (sem descritor), usa o motor
 * mock/AWS antigo.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, descriptor, fileName } = body as {
      eventId?: string;
      descriptor?: number[];
      fileName?: string;
    };

    if (!eventId) {
      return NextResponse.json(
        { error: "Evento obrigatório" },
        { status: 400 }
      );
    }

    let matches;

    if (Array.isArray(descriptor) && descriptor.length === 128) {
      // Caminho REAL: comparação por descritor face-api.js
      matches = await matchFaceByDescriptor(eventId, descriptor, 0.55);
    } else if (fileName) {
      // Fallback mock/AWS
      matches = await matchFaceInEvent(eventId, fileName, 0.7);
    } else {
      return NextResponse.json(
        { error: "Nenhum rosto detetado na selfie. Tente outra foto." },
        { status: 400 }
      );
    }

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
