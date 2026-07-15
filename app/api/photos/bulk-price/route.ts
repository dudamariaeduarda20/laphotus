import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const bulkPriceSchema = z.object({
  photoIds: z.array(z.string().min(1)).min(1),
  price: z.number().min(0),
});

/**
 * PATCH /api/photos/bulk-price
 * Apply one price to several of the logged-in photographer's photos at once.
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { photoIds, price } = bulkPriceSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const photographer = await prisma.photographer.findUnique({
      where: { userId },
    });

    const isAdmin = user?.role === UserRole.ADMIN;
    if (!photographer && !isAdmin) {
      return NextResponse.json(
        { error: "Fotógrafo não encontrado" },
        { status: 404 }
      );
    }

    const result = await prisma.photo.updateMany({
      where: {
        id: { in: photoIds },
        ...(isAdmin ? {} : { photographerId: photographer!.id }),
      },
      data: { price },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Nenhuma foto atualizada — verifique se são suas" },
        { status: 403 }
      );
    }

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validação falhou", details: error.issues },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Falha ao atualizar preços";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
