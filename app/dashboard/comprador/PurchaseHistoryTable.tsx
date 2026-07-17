"use client";

import Link from "next/link";
import { Order, OrderItem, Photo } from "@prisma/client";
import { getPhotoImageUrl } from "@/lib/photoUrl";

interface OrderWithItems extends Order {
  items: (OrderItem & {
    photo: Photo & {
      event: { id: string; title: string };
      photographer: { user: { name: string } };
    };
  })[];
}

interface PurchaseHistoryTableProps {
  orders: OrderWithItems[];
}

export default function PurchaseHistoryTable({
  orders,
}: PurchaseHistoryTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-[#eee] bg-white p-12 text-center">
        <p className="text-[#666]">Nenhuma compra realizada ainda.</p>
        <Link
          href="/photos"
          className="mt-4 inline-block rounded-lg bg-[#09419b] px-6 py-2 text-white hover:bg-[#09419b]/90"
        >
          Ver Fotos Disponíveis
        </Link>
      </div>
    );
  }

  const getEventNames = (order: OrderWithItems) => {
    const events = new Set(order.items.map((item) => item.photo.event.title));
    return Array.from(events).slice(0, 2).join(", ");
  };

  const getPhotographerNames = (order: OrderWithItems) => {
    const names = new Set(
      order.items.map((item) => item.photo.photographer.user.name)
    );
    return Array.from(names).slice(0, 2).join(", ");
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-[#eee] bg-white shadow-sm">
      <table className="min-w-full divide-y divide-[#eee]">
        <thead className="bg-[#f5f1e8]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#333]">
              Fotos
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#333]">
              Data da Compra
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#333]">
              Evento
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#333]">
              Fotógrafo
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-[#333]">
              Total
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-[#333]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eee]">
          {orders.map((order) => {
            const thumbnails = order.items.slice(0, 3);
            const extraCount = order.items.length - thumbnails.length;

            return (
              <tr key={order.id} className="hover:bg-[#f5f1e8]/60">
                <td className="px-6 py-4">
                  <div className="flex items-center -space-x-2">
                    {thumbnails.map((item) => (
                      <img
                        key={item.id}
                        src={getPhotoImageUrl(
                          item.photo.thumbnailKey || item.photo.key,
                          item.photo.name
                        )}
                        alt={item.photo.name}
                        className="h-10 w-10 rounded-md border-2 border-white object-cover shadow-sm"
                      />
                    ))}
                    {extraCount > 0 && (
                      <span className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-white bg-[#09419b]/10 text-xs font-semibold text-[#09419b] shadow-sm">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#333]">
                  {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-[#666]">
                  {getEventNames(order)}
                </td>
                <td className="px-6 py-4 text-sm text-[#666]">
                  {getPhotographerNames(order)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-[#f0bf38]">
                  €{order.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/comprador/order/${order.id}`}
                      className="inline-block rounded-md bg-[#09419b]/10 px-3 py-1 text-xs font-medium text-[#09419b] hover:bg-[#09419b]/20"
                    >
                      Detalhes
                    </Link>
                    <Link
                      href={`/download/${order.id}`}
                      className="inline-block rounded-md bg-[#ff2f92]/10 px-3 py-1 text-xs font-medium text-[#ff2f92] hover:bg-[#ff2f92]/20"
                    >
                      Baixar
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
