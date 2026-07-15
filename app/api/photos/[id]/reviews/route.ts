import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import {
  createOrUpdateReview,
  deleteOwnReview,
  getPhotoReviews,
} from "@/lib/services/reviewService";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/**
 * GET /api/photos/[id]/reviews
 * Avaliações aprovadas (públicas) + média + a avaliação do próprio utilizador
 * (qualquer estado), se autenticado.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: photoId } = await params;
  const userId = getUserIdFromRequest(request);

  const result = await getPhotoReviews(photoId, userId);
  return NextResponse.json(result);
}

/**
 * POST /api/photos/[id]/reviews
 * Cria ou atualiza a avaliação do utilizador logado (upsert — uma por
 * pessoa por foto). Exige compra verificada. Volta para "pending" até
 * um admin aprovar.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id: photoId } = await params;
    const body = await request.json();
    const { rating, comment } = reviewSchema.parse(body);

    const review = await createOrUpdateReview(userId, photoId, rating, comment);
    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Nota deve ser de 1 a 5" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Falha ao avaliar";
    const status = message.includes("Só quem comprou") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * DELETE /api/photos/[id]/reviews
 * Apaga a própria avaliação.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id: photoId } = await params;
    const result = await deleteOwnReview(userId, photoId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao apagar";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
