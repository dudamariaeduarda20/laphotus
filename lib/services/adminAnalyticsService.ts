import prisma from "@/lib/db/prisma";

export interface SalesByDay {
  date: string;
  count: number;
  revenue: number;
}

export interface CumulativePoint {
  date: string;
  total: number;
}

export interface WeeklySignups {
  weekStart: string;
  count: number;
}

export interface PhotosBySport {
  sport: string;
  count: number;
}

export interface TopPhotographer {
  photographerId: string;
  name: string;
  salesCount: number;
  revenue: number;
}

export interface TopEvent {
  eventId: string;
  title: string;
  photosSold: number;
  revenue: number;
}

export interface PlatformAnalytics {
  totalSales: number;
  grossRevenue: number;
  platformCommission: number;
  activeUsers: number;
  totalPhotos: number;
  salesByDay: SalesByDay[];
  cumulative: CumulativePoint[];
  weeklySignups: WeeklySignups[];
  photosBySport: PhotosBySport[];
  topPhotographers: TopPhotographer[];
  topEvents: TopEvent[];
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);

  // Totals — aggregated in the DB, no full-table fetch
  const [orderAgg, transactionAgg, activeUserGroups, totalPhotos] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "completed" },
      _sum: { commission: true },
    }),
    // "Ativo" = fez login nos últimos 30 dias (não há campo lastLogin no
    // User; authService já grava um AuditLog "login" a cada sessão).
    prisma.auditLog.groupBy({
      by: ["userId"],
      where: { action: "login", createdAt: { gte: thirtyDaysAgo }, userId: { not: null } },
    }),
    prisma.photo.count({ where: { status: "AVAILABLE" } }),
  ]);

  // Sales by day (last 30 days) — bounded window, bucketed in memory
  const recentOrders = await prisma.order.findMany({
    where: { status: "COMPLETED", paidAt: { gte: thirtyDaysAgo } },
    select: { paidAt: true, total: true },
  });

  const byDate = new Map<string, { count: number; revenue: number }>();
  for (const o of recentOrders) {
    if (!o.paidAt) continue;
    const key = o.paidAt.toISOString().slice(0, 10);
    const cur = byDate.get(key) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += o.total;
    byDate.set(key, cur);
  }
  const salesByDay: SalesByDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const v = byDate.get(key) || { count: 0, revenue: 0 };
    salesByDay.push({ date: key, ...v });
  }

  let running = 0;
  const cumulative: CumulativePoint[] = salesByDay.map((d) => {
    running += d.revenue;
    return { date: d.date, total: running };
  });

  // New users per week (last 12 weeks) — bounded window, bucketed in memory
  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: twelveWeeksAgo } },
    select: { createdAt: true },
  });

  const byWeek = new Map<string, number>();
  for (const u of recentUsers) {
    const weekStart = new Date(u.createdAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday start
    const key = weekStart.toISOString().slice(0, 10);
    byWeek.set(key, (byWeek.get(key) || 0) + 1);
  }
  const weeklySignups: WeeklySignups[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7 - d.getDay());
    const key = d.toISOString().slice(0, 10);
    weeklySignups.push({ weekStart: key, count: byWeek.get(key) || 0 });
  }

  // Photos by sport — cross-table count, no direct Prisma groupBy for this
  // shape (Photo has no sport column, only via Event), so one raw
  // aggregate query instead of loading every photo into memory.
  const photosBySportRaw = await prisma.$queryRaw<{ sport: string; count: bigint }[]>`
    SELECT e.sport as sport, COUNT(p.id) as count
    FROM "Photo" p
    JOIN "Event" e ON e.id = p."eventId"
    WHERE p.status = 'AVAILABLE'
    GROUP BY e.sport
    ORDER BY count DESC
  `;
  const photosBySport: PhotosBySport[] = photosBySportRaw.map((r) => ({
    sport: r.sport,
    count: Number(r.count),
  }));

  // Top photographers by sales — DB-side groupBy + orderBy on aggregate
  const topPhotographerGroups = await prisma.transaction.groupBy({
    by: ["photographerId"],
    where: { status: "completed" },
    _sum: { photographerPayout: true },
    _count: { _all: true },
    orderBy: { _sum: { photographerPayout: "desc" } },
    take: 10,
  });
  const photographerIds = topPhotographerGroups.map((g) => g.photographerId);
  const photographers = await prisma.photographer.findMany({
    where: { id: { in: photographerIds } },
    include: { user: { select: { name: true } } },
  });
  const photographerNameById = new Map(photographers.map((p) => [p.id, p.user.name]));
  const topPhotographers: TopPhotographer[] = topPhotographerGroups.map((g) => ({
    photographerId: g.photographerId,
    name: photographerNameById.get(g.photographerId) || "—",
    salesCount: g._count._all,
    revenue: g._sum.photographerPayout || 0,
  }));

  // Top events by revenue — cross-table (Event -> Photo -> OrderItem -> Order),
  // one raw aggregate query rather than pulling every order item into memory.
  const topEventsRaw = await prisma.$queryRaw<
    { id: string; title: string; revenue: number; photosSold: bigint }[]
  >`
    SELECT e.id as id, e.title as title,
           COALESCE(SUM(oi.price), 0)::float as revenue,
           COUNT(oi.id) as "photosSold"
    FROM "Event" e
    JOIN "Photo" p ON p."eventId" = e.id
    JOIN "OrderItem" oi ON oi."photoId" = p.id
    JOIN "Order" o ON o.id = oi."orderId" AND o.status = 'COMPLETED'
    GROUP BY e.id, e.title
    ORDER BY revenue DESC
    LIMIT 10
  `;
  const topEvents: TopEvent[] = topEventsRaw.map((r) => ({
    eventId: r.id,
    title: r.title,
    photosSold: Number(r.photosSold),
    revenue: r.revenue,
  }));

  return {
    totalSales: orderAgg._count._all,
    grossRevenue: orderAgg._sum.total || 0,
    platformCommission: transactionAgg._sum.commission || 0,
    activeUsers: activeUserGroups.length,
    totalPhotos,
    salesByDay,
    cumulative,
    weeklySignups,
    photosBySport,
    topPhotographers,
    topEvents,
  };
}
