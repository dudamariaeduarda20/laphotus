import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserIdFromCookies } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import StatCard from "./StatCard";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Meu Dashboard - Laphotus",
};

export default async function BuyerDashboardPage() {
  const userId = await getUserIdFromCookies();
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

  // Fetch completed purchases for this user (a "compra" is a paid order)
  const orders = await prisma.order.findMany({
    where: { userId, status: "COMPLETED" },
    include: {
      items: {
        include: {
          photo: {
            include: {
              event: { select: { id: true, title: true } },
              photographer: {
                include: { user: { select: { name: true } } },
              },
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
    <div className="min-h-screen bg-[#f5f1e8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-[#09419b]">
            Bem-vindo, {user.name}!
          </h1>
          <p className="mt-2 text-[#666]">
            Gerencie suas compras e downloads de fotos
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total de Compras"
            value={totalOrders}
            icon="🛍️"
            color="bg-white border-[#09419b]/30"
          />
          <StatCard
            label="Total Gasto"
            value={`€${totalSpent.toFixed(2)}`}
            icon="💳"
            color="bg-[#f0bf38]/10 border-[#f0bf38]/40"
          />
          <StatCard
            label="Fotos Compradas"
            value={totalPhotosPurchased}
            icon="📸"
            color="bg-[#ff2f92]/10 border-[#ff2f92]/40"
          />
          <StatCard
            label="Fotos Baixadas"
            value={downloadsCount}
            icon="⬇️"
            color="bg-[#09419b]/10 border-[#09419b]/40"
          />
        </div>

        {/* Purchase History */}
        <div>
          <h2 className="mb-6 font-serif text-2xl font-bold text-[#09419b]">
            Histórico de Compras
          </h2>
          <Suspense fallback={<div className="text-center py-8 text-[#666]">Carregando...</div>}>
            <DashboardClient orders={orders} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
