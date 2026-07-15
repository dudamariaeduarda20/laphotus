import { notFound, redirect } from "next/navigation";
import { getUserIdFromCookies } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import Link from "next/link";
import OrderStatusBadge from "./OrderStatusBadge";
import PhotoGridClient from "./PhotoGridClient";
import RecomprarButton from "./RecomprarButton";

export const metadata = {
  title: "Detalhes da Compra - Laphotus",
};

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { orderId } = await params;

  const userId = await getUserIdFromCookies();
  if (!userId) {
    redirect("/auth/login");
  }

  // Fetch order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          photo: {
            include: {
              event: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Security: verify ownership
  if (order.userId !== userId) {
    redirect("/");
  }

  const firstEvent = order.items[0]?.photo.event;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back Link */}
        <Link
          href="/dashboard/comprador"
          className="mb-6 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          ← Voltar ao Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Detalhes da Compra
            </h1>
            <p className="mt-2 text-slate-600">
              Pedido #{orderId.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Order Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">Data da Compra</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">Evento</p>
            {firstEvent && (
              <Link
                href={`/photos/${firstEvent.id}`}
                className="mt-2 text-lg font-semibold text-blue-600 hover:text-blue-700"
              >
                {firstEvent.title}
              </Link>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">Fotos Compradas</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {order.items.length}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">Total Pago</p>
            <p className="mt-2 text-lg font-semibold text-green-600">
              €{order.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium text-slate-900">
                €{order.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Taxa (23%)</span>
              <span className="font-medium text-slate-900">
                €{order.tax.toFixed(2)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Desconto</span>
                <span className="font-medium text-green-600">
                  -€{order.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-lg font-bold text-slate-900">
                  €{order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {order.status === "COMPLETED" && (
          <div className="mb-8 flex flex-wrap gap-4">
            <Link
              href={`/download/${orderId}`}
              className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
            >
              ⬇ Baixar Fotos
            </Link>
            <RecomprarButton />
          </div>
        )}

        {/* Photos Grid */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Fotos Compradas ({order.items.length})
          </h2>
          <PhotoGridClient photos={order.items} orderId={orderId} />
        </div>
      </div>
    </div>
  );
}
