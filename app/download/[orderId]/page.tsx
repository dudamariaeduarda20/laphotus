import { notFound, redirect } from "next/navigation";
import { getUserIdFromCookies } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";
import DownloadClient from "./DownloadClient";

export const metadata = {
  title: "Downloads - Laphotus",
};

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function DownloadPage({ params }: Props) {
  const { orderId } = await params;

  const userId = await getUserIdFromCookies();
  if (!userId) {
    redirect("/auth/login");
  }

  // Fetch order with items
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          photo: {
            select: {
              id: true,
              name: true,
              key: true,
              thumbnailKey: true,
              price: true,
              width: true,
              height: true,
            },
          },
        },
      },
      user: {
        select: { email: true },
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

  // Security: verify payment completed
  if (order.status !== "COMPLETED") {
    redirect("/carrinho");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Seus Downloads</h1>
          <p className="mt-2 text-slate-600">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-sm text-slate-500">
            Comprado em{" "}
            {new Date(order.createdAt).toLocaleDateString("pt-BR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Order Summary */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-slate-600">Fotos</p>
              <p className="text-2xl font-bold text-slate-900">
                {order.items.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Subtotal</p>
              <p className="text-2xl font-bold text-slate-900">
                €{order.subtotal.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Taxa</p>
              <p className="text-2xl font-bold text-slate-900">
                €{order.tax.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">
                €{order.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Download Client Component */}
        <DownloadClient
          orderId={orderId}
          photos={order.items.map((item) => ({
            id: item.photo.id,
            name: item.photo.name,
            key: item.photo.key,
            thumbnailKey: item.photo.thumbnailKey,
            price: item.price,
            width: item.photo.width,
            height: item.photo.height,
          }))}
          expiresAt={new Date(Date.now() + 24 * 60 * 60 * 1000)}
        />
      </div>
    </div>
  );
}
