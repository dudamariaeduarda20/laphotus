import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { updatePhotoBibNumbers } from "@/lib/services/ocrService";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const updateSchema = z.object({
  bibNumbers: z.array(z.string().min(1)),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    // Verify user owns this photo
    const photo = await prisma.photo.findUnique({
      where: { id: (await params).id },
      include: { photographer: true },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Foto não encontrada" },
        { status: 404 }
      );
    }

    if (photo.photographer.userId !== userId) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    // Update bib numbers
    await updatePhotoBibNumbers((await params).id, validated.bibNumbers);

    return NextResponse.json(
      { success: true, bibNumbers: validated.bibNumbers },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validação falhou", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Falha ao atualizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
