import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { updateFaceVector } from "@/lib/services/faceService";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const updateSchema = z.object({
  photoId: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

/**
 * PUT /api/photos/face-index
 * Admin endpoint para corrigir vetores faciais manualmente
 */
export async function PUT(request: NextRequest) {
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

    // Verificar se é admin (futura validação)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas admin pode atualizar vetores" },
        { status: 403 }
      );
    }

    // Buscar foto
    const photo = await prisma.photo.findUnique({
      where: { id: validated.photoId },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Foto não encontrada" },
        { status: 404 }
      );
    }

    // Gerar novo vetor aleatório (em produção: seria reprocessamento real)
    const newVectorArray = Array.from({ length: 128 }, () =>
      Math.random() * 2 - 1
    );

    // Atualizar (converter vetor para Record)
    await updateFaceVector(
      validated.photoId,
      photo.photographerId,
      { vector: newVectorArray, mode: "manual_update" },
      validated.confidence
    );

    return NextResponse.json(
      { success: true, message: "Vetor facial atualizado" },
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
