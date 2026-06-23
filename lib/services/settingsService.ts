import prisma from "@/lib/db/prisma";

export const DEFAULT_COMMISSION_RATE = 0.2; // 20% platform / 80% photographer
export const TAX_RATE = 0.23; // 23% IVA Portugal

const COMMISSION_KEY = "commission_rate";

/**
 * Read the live commission rate from the Setting table.
 * Falls back to default if never set.
 */
export async function getCommissionRate(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: COMMISSION_KEY } });
  if (!row) return DEFAULT_COMMISSION_RATE;
  const parsed = parseFloat(row.value);
  return Number.isFinite(parsed) ? parsed : DEFAULT_COMMISSION_RATE;
}

/**
 * Update commission rate (admin only). Persists to Setting + audit log.
 * Takes effect immediately for all subsequent payment splits.
 */
export async function updateCommissionRate(newRate: number, adminUserId: string) {
  if (newRate < 0 || newRate > 1) {
    throw new Error("Taxa deve estar entre 0 e 1 (0-100%)");
  }

  await prisma.setting.upsert({
    where: { key: COMMISSION_KEY },
    update: { value: String(newRate) },
    create: { key: COMMISSION_KEY, value: String(newRate) },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: "platform_settings_updated",
      resource: "settings",
      resourceId: COMMISSION_KEY,
      changes: { commissionRate: newRate },
    },
  });

  return { commissionRate: newRate, taxRate: TAX_RATE };
}

/**
 * Platform earnings from real completed transactions.
 */
export async function getPlatformEarnings() {
  const agg = await prisma.transaction.aggregate({
    where: { status: "completed" },
    _sum: { commission: true, photographerPayout: true },
    _count: true,
  });

  const totalEarnings = agg._sum.commission || 0;
  const totalPhotographerPayout = agg._sum.photographerPayout || 0;

  return {
    totalEarnings,
    totalPhotographerPayout,
    totalProcessed: totalEarnings + totalPhotographerPayout,
    transactionCount: agg._count,
  };
}

/**
 * Get commission history
 */
export async function getCommissionHistory(limit: number = 50) {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      photographer: { select: { user: { select: { name: true } } } },
      order: { select: { id: true, total: true, createdAt: true } },
    },
  });

  return transactions.map((t) => ({
    id: t.id,
    photographerName: t.photographer.user.name,
    amount: t.amount,
    commission: t.commission,
    photographerPayout: t.photographerPayout,
    status: t.status,
    createdAt: t.createdAt,
    orderId: t.order.id,
  }));
}
