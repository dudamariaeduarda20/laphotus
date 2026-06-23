import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";

/**
 * GET /api/organizer/stats
 * Retorna estatísticas dos eventos do organizador
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar organizador
    const organizer = await prisma.organizer.findUnique({
      where: { userId },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: "Organizador não encontrado" },
        { status: 404 }
      );
    }

    // Buscar eventos do organizador
    const events = await prisma.event.findMany({
      where: { organizerId: organizer.id },
      include: {
        photos: true,
      },
      orderBy: { date: "desc" },
    });

    // Calcular stats por evento
    const eventStats = await Promise.all(
      events.map(async (event) => {
        // Contar fotos vendidas (apenas encomendas PAGAS)
        const soldPhotos = await prisma.orderItem.findMany({
          where: {
            photo: { eventId: event.id },
            order: { status: "COMPLETED" },
          },
        });

        // Calcular faturamento
        const revenue = soldPhotos.reduce((sum, item) => sum + item.price, 0);

        return {
          id: event.id,
          title: event.title,
          sport: event.sport,
          date: event.date,
          photoCount: event.photos.length,
          photosSold: soldPhotos.length,
          revenue,
        };
      })
    );

    // Stats globais
    const totalPhotos = events.reduce((sum, e) => sum + e.photos.length, 0);
    const allSoldPhotos = eventStats.reduce((sum, e) => sum + e.photosSold, 0);
    const totalRevenue = eventStats.reduce((sum, e) => sum + e.revenue, 0);
    const conversionRate =
      totalPhotos > 0 ? (allSoldPhotos / totalPhotos) * 100 : 0;

    return NextResponse.json({
      events: eventStats,
      stats: {
        eventCount: events.length,
        totalPhotosSold: allSoldPhotos,
        totalRevenue,
        conversionRate,
      },
    });
  } catch (error) {
    console.error("Organizer stats error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
