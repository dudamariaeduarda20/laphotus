import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import StatCard from "./StatCard";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Meu Dashboard - Laphotus",
};

export default async function BuyerDashboardPage() {
  const cookieStore = await cookies();
  const req = {
    headers: {
      cookie: cookieStore.toString(),
    },
  } as any;

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    redirect("/auth/login");
  }

  // Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, role: true },
  });

  if (!user || user.role !== "CLIENT") {
    redirect("/");
  }

  // Fetch all orders for this user
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          photo: {
            include: {
              event: { select: { title: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch downloads count
  const downloadsCount = await prisma.download.count({
    where: { userId },
  });

  // Calculate stats
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const totalPhotosPurchased = orders.reduce(
    (sum, order) => sum + order.items.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            Bem-vindo, {user.name}!
          </h1>
          <p className="mt-2 text-slate-600">
            Gerencie suas compras e downloads de fotos
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total de Compras"
            value={totalOrders}
            icon="🛍️"
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            label="Total Gasto"
            value={`€${totalSpent.toFixed(2)}`}
            icon="💳"
            color="bg-green-50 border-green-200"
          />
          <StatCard
            label="Fotos Compradas"
            value={totalPhotosPurchased}
            icon="📸"
            color="bg-purple-50 border-purple-200"
          />
          <StatCard
            label="Fotos Baixadas"
            value={downloadsCount}
            icon="⬇️"
            color="bg-orange-50 border-orange-200"
          />
        </div>

        {/* Purchase History */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Histórico de Compras
          </h2>
          <Suspense fallback={<div className="text-center py-8">Carregando...</div>}>
            <DashboardClient orders={orders} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
