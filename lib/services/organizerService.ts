import prisma from "@/lib/db/prisma";

export interface RevenueByDay {
  date: string; // YYYY-MM-DD
  count: number;
  revenue: number;
}

export interface PhotographerRanking {
  photographerId: string;
  name: string;
  photosSold: number;
  revenue: number;
}

export interface OrganizerOrderRow {
  orderId: string;
  createdAt: string;
  status: string;
  buyerName: string;
  buyerEmail: string;
  itemCount: number;
  total: number;
}

export interface OrganizerEventDetail {
  event: {
    id: string;
    title: string;
    sport: string;
    date: string;
    location: string | null;
  };
  totals: {
    photoCount: number;
    photosSold: number;
    revenue: number;
    orderCount: number;
  };
  revenueByDay: RevenueByDay[];
  photographerRanking: PhotographerRanking[];
  orders: OrganizerOrderRow[];
}

export interface OrganizerEventFilters {
  days?: 30 | 60 | 90;
  status?: string;
  from?: Date;
  to?: Date;
}

/**
 * Painel de um evento do organizador: faturamento por dia, ranking de
 * fotógrafos (por vendas concluídas) e lista de encomendas com filtros.
 * Retorna null se o evento não existe, "forbidden" se não pertence ao organizador.
 */
export async function getOrganizerEventDetail(
  userId: string,
  eventId: string,
  filters: OrganizerEventFilters = {}
): Promise<OrganizerEventDetail | null | "forbidden"> {
  const organizer = await prisma.organizer.findUnique({ where: { userId } });
  if (!organizer) return null;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  if (event.organizerId !== organizer.id) return "forbidden";

  const days = filters.days ?? 30;

  const [photoCount, completedItems] = await Promise.all([
    prisma.photo.count({ where: { eventId } }),
    prisma.orderItem.findMany({
      where: { photo: { eventId }, order: { status: "COMPLETED" } },
      select: {
        price: true,
        createdAt: true,
        photo: {
          select: {
            photographerId: true,
            photographer: { select: { user: { select: { name: true } } } },
          },
        },
      },
    }),
  ]);

  // Ranking de fotógrafos — acumulado (todas as vendas concluídas do evento)
  const rankingMap = new Map<string, PhotographerRanking>();
  for (const item of completedItems) {
    const key = item.photo.photographerId;
    const existing = rankingMap.get(key);
    if (existing) {
      existing.photosSold += 1;
      existing.revenue += item.price;
    } else {
      rankingMap.set(key, {
        photographerId: key,
        name: item.photo.photographer.user.name,
        photosSold: 1,
        revenue: item.price,
      });
    }
  }
  const photographerRanking = Array.from(rankingMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  // Faturamento por dia — janela de `days` dias, preenchendo dias sem vendas
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - (days - 1));
  windowStart.setHours(0, 0, 0, 0);

  const byDate = new Map<string, { count: number; revenue: number }>();
  for (const item of completedItems) {
    if (item.createdAt < windowStart) continue;
    const key = item.createdAt.toISOString().slice(0, 10);
    const cur = byDate.get(key) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += item.price;
    byDate.set(key, cur);
  }
  const revenueByDay: RevenueByDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const v = byDate.get(key) || { count: 0, revenue: 0 };
    revenueByDay.push({ date: key, count: v.count, revenue: v.revenue });
  }

  // Pedidos — todas as encomendas com itens deste evento, com filtros
  const orderWhere: Record<string, unknown> = {};
  if (filters.status) orderWhere.status = filters.status;
  if (filters.from || filters.to) {
    orderWhere.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { photo: { eventId }, order: orderWhere },
    orderBy: { createdAt: "desc" },
    select: {
      orderId: true,
      price: true,
      order: {
        select: {
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  const orderMap = new Map<string, OrganizerOrderRow>();
  for (const item of orderItems) {
    const existing = orderMap.get(item.orderId);
    if (existing) {
      existing.itemCount += 1;
      existing.total += item.price;
    } else {
      orderMap.set(item.orderId, {
        orderId: item.orderId,
        createdAt: item.order.createdAt.toISOString(),
        status: item.order.status,
        buyerName: item.order.user.name,
        buyerEmail: item.order.user.email,
        itemCount: 1,
        total: item.price,
      });
    }
  }
  const orders = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalRevenueAllTime = completedItems.reduce((s, i) => s + i.price, 0);

  return {
    event: {
      id: event.id,
      title: event.title,
      sport: event.sport,
      date: event.date.toISOString(),
      location: event.location,
    },
    totals: {
      photoCount,
      photosSold: completedItems.length,
      revenue: totalRevenueAllTime,
      orderCount: orders.length,
    },
    revenueByDay,
    photographerRanking,
    orders,
  };
}
