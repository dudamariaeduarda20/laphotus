import prisma from "@/lib/db/prisma";
import { OrderStatus } from "@prisma/client";
import { getCommissionRate, TAX_RATE } from "./settingsService";

export async function createOrder(
  userId: string,
  items: Array<{ photoId: string; price: number }>,
  subtotal: number,
  discount: number = 0,
  couponId?: string
) {
  const tax = (subtotal - discount) * TAX_RATE; // 23% IVA Portugal
  const total = subtotal - discount + tax;

  const order = await prisma.order.create({
    data: {
      userId,
      subtotal,
      tax,
      discount,
      total,
      couponId,
      status: OrderStatus.PENDING,
      items: {
        create: items.map((item) => ({
          photoId: item.photoId,
          price: item.price,
          quantity: 1,
        })),
      },
    },
    include: {
      items: { include: { photo: true } },
    },
  });

  return order;
}

export async function getOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { photo: { include: { photographer: true } } } },
      coupon: true,
    },
  });

  return order;
}

export async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: { include: { photo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders;
}

export async function confirmPayment(orderId: string, stripePaymentId: string) {
  // Idempotency guard: never pay out twice for the same order
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (!existing) {
    throw new Error("Encomenda não encontrada");
  }
  if (existing.status === OrderStatus.COMPLETED) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { photo: { include: { photographer: true } } } } },
    });
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.COMPLETED,
      stripePaymentId,
      paidAt: new Date(),
    },
    include: {
      items: { include: { photo: { include: { photographer: true } } } },
    },
  });

  // Aggregate per photographer: revenue + photo count
  const perPhotographer = new Map<string, { amount: number; count: number }>();

  for (const item of order.items) {
    const photographerId = item.photo.photographerId;
    const cur = perPhotographer.get(photographerId) || { amount: 0, count: 0 };
    cur.amount += item.price;
    cur.count += 1;
    perPhotographer.set(photographerId, cur);
  }

  // Live commission rate (admin-configurable, 80/20 default)
  const commissionRate = await getCommissionRate();

  for (const [photographerId, { amount, count }] of perPhotographer) {
    const commission = amount * commissionRate;
    const payout = amount - commission;

    await prisma.transaction.create({
      data: {
        orderId,
        photographerId,
        amount,
        commission,
        photographerPayout: payout,
        status: "completed",
      },
    });

    // Update photographer stats (only this photographer's items)
    await prisma.photographer.update({
      where: { id: photographerId },
      data: {
        totalSales: { increment: count },
        totalRevenue: { increment: payout },
      },
    });
  }

  return order;
}

export async function getPhotographerEarnings(photographerId: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      photographerId,
      status: "completed",
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarnings = transactions.reduce(
    (sum, t) => sum + t.photographerPayout,
    0
  );
  const totalOrders = transactions.length;

  return {
    totalEarnings,
    totalOrders,
    transactions,
  };
}
