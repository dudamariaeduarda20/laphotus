import prisma from "@/lib/db/prisma";

export interface SalesByDay {
  date: string; // YYYY-MM-DD
  count: number;
  revenue: number; // payout do fotógrafo (80%)
}

export interface PhotographerStats {
  totalRevenue: number; // soma payout (completed)
  totalSales: number; // nº de transações completed
  photosForSale: number; // fotos AVAILABLE do fotógrafo
  pendingPayout: number; // disponível para saque (sem trilho de pagamento real)
  thisMonth: number;
  eventsCount: number; // eventos distintos onde o fotógrafo tem fotos
  salesByDay: SalesByDay[]; // últimos 30 dias
}

/**
 * Estatísticas reais do fotógrafo a partir das Transaction (payout 80%).
 * @param userId id do User (não do Photographer)
 */
export async function getPhotographerStats(
  userId: string
): Promise<PhotographerStats | null> {
  const photographer = await prisma.photographer.findUnique({
    where: { userId },
  });
  if (!photographer) return null;

  const [transactions, photosForSale, eventGroups] = await Promise.all([
    prisma.transaction.findMany({
      where: { photographerId: photographer.id, status: "completed" },
      orderBy: { createdAt: "asc" },
      select: { photographerPayout: true, createdAt: true },
    }),
    prisma.photo.count({
      where: { photographerId: photographer.id, status: "AVAILABLE" },
    }),
    prisma.photo.groupBy({
      by: ["eventId"],
      where: { photographerId: photographer.id },
    }),
  ]);
  const eventsCount = eventGroups.length;

  const totalRevenue = transactions.reduce(
    (s, t) => s + t.photographerPayout,
    0
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = transactions
    .filter((t) => t.createdAt >= monthStart)
    .reduce((s, t) => s + t.photographerPayout, 0);

  // Vendas por dia — últimos 30 dias (preenche dias vazios com 0)
  const days: SalesByDay[] = [];
  const byDate = new Map<string, { count: number; revenue: number }>();
  for (const t of transactions) {
    const key = t.createdAt.toISOString().slice(0, 10);
    const cur = byDate.get(key) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += t.photographerPayout;
    byDate.set(key, cur);
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const v = byDate.get(key) || { count: 0, revenue: 0 };
    days.push({ date: key, count: v.count, revenue: v.revenue });
  }

  return {
    totalRevenue,
    totalSales: transactions.length,
    photosForSale,
    pendingPayout: totalRevenue, // sem registo de saques -> tudo disponível
    thisMonth,
    eventsCount,
    salesByDay: days,
  };
}

export interface PhotographerEventSummary {
  id: string;
  title: string;
  sport: string;
  date: string;
  photoCount: number;
  soldCount: number;
  revenue: number;
}

export interface SoldPhotoEntry {
  photoId: string;
  photoName: string;
  eventId: string;
  eventTitle: string;
  price: number;
  orderId: string;
  createdAt: string;
  buyerName: string;
}

export interface PhotographerEventsResult {
  events: PhotographerEventSummary[];
  recentSales: SoldPhotoEntry[];
}

/**
 * Eventos onde o fotógrafo tem fotos carregadas + histórico real de vendas
 * por foto (join OrderItem -> Photo -> Event, filtrado por Order pago).
 */
export async function getPhotographerEvents(
  userId: string
): Promise<PhotographerEventsResult | null> {
  const photographer = await prisma.photographer.findUnique({
    where: { userId },
  });
  if (!photographer) return null;

  const photos = await prisma.photo.findMany({
    where: { photographerId: photographer.id },
    select: {
      id: true,
      eventId: true,
      event: { select: { id: true, title: true, sport: true, date: true } },
    },
  });

  const eventMap = new Map<string, PhotographerEventSummary>();
  for (const p of photos) {
    const existing = eventMap.get(p.eventId);
    if (existing) {
      existing.photoCount += 1;
    } else {
      eventMap.set(p.eventId, {
        id: p.event.id,
        title: p.event.title,
        sport: p.event.sport,
        date: p.event.date.toISOString(),
        photoCount: 1,
        soldCount: 0,
        revenue: 0,
      });
    }
  }

  const orderItems = await prisma.orderItem.findMany({
    where: {
      photo: { photographerId: photographer.id },
      order: { status: "COMPLETED" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      price: true,
      createdAt: true,
      orderId: true,
      photo: {
        select: {
          id: true,
          name: true,
          eventId: true,
          event: { select: { title: true } },
        },
      },
      order: { select: { user: { select: { name: true } } } },
    },
  });

  const recentSales: SoldPhotoEntry[] = [];
  for (const item of orderItems) {
    const ev = eventMap.get(item.photo.eventId);
    if (ev) {
      ev.soldCount += 1;
      ev.revenue += item.price;
    }
    recentSales.push({
      photoId: item.photo.id,
      photoName: item.photo.name,
      eventId: item.photo.eventId,
      eventTitle: item.photo.event.title,
      price: item.price,
      orderId: item.orderId,
      createdAt: item.createdAt.toISOString(),
      buyerName: item.order.user.name,
    });
  }

  return {
    events: Array.from(eventMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    recentSales: recentSales.slice(0, 20),
  };
}
