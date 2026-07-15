import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const reportSchema = z.object({ reason: z.string().min(3) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = reportSchema.parse(body);
    const { id: photoId } = await params;

    const photo = await prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) {
      return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
    }

    const report = await prisma.report.create({
      data: { photoId, reporterId: userId, reason },
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Motivo obrigatório (mín. 3 caracteres)" },
        { status: 400 }
      );
    }
    console.error("Report photo error:", error);
    return NextResponse.json({ error: "Falha ao denunciar foto" }, { status: 500 });
  }
}
