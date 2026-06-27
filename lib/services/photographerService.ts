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

  const [transactions, photosForSale] = await Promise.all([
    prisma.transaction.findMany({
      where: { photographerId: photographer.id, status: "completed" },
      orderBy: { createdAt: "asc" },
      select: { photographerPayout: true, createdAt: true },
    }),
    prisma.photo.count({
      where: { photographerId: photographer.id, status: "AVAILABLE" },
    }),
  ]);

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
    salesByDay: days,
  };
}
