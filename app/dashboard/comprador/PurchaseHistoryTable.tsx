"use client";

import Link from "next/link";
import { Order, OrderItem, Photo } from "@prisma/client";

interface OrderWithItems extends Order {
  items: (OrderItem & {
    photo: Photo & { event: { title: string } };
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
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-600">Nenhuma compra realizada ainda.</p>
        <Link
          href="/photos"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Ver Fotos Disponíveis
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: {
      [key: string]: { label: string; color: string };
    } = {
      PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      COMPLETED: { label: "Pago", color: "bg-green-100 text-green-800" },
      PROCESSING: { label: "Processando", color: "bg-blue-100 text-blue-800" },
      FAILED: { label: "Falhou", color: "bg-red-100 text-red-800" },
      REFUNDED: { label: "Reembolsado", color: "bg-slate-100 text-slate-800" },
    };

    const statusInfo = statusMap[status] || statusMap.PENDING;
    return (
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getEventNames = (order: OrderWithItems) => {
    const events = new Set(order.items.map((item) => item.photo.event.title));
    return Array.from(events).slice(0, 2).join(", ");
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
              Data da Compra
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
              Evento
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-slate-900">
              Fotos
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900">
              Total
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-slate-900">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 text-sm text-slate-900">
                {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {getEventNames(order)}
              </td>
              <td className="px-6 py-4 text-center text-sm font-medium text-slate-900">
                {order.items.length}
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                €{order.total.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-center">
                {getStatusBadge(order.status)}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/comprador/order/${order.id}`}
                    className="inline-block rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                  >
                    Detalhes
                  </Link>
                  {order.status === "COMPLETED" && (
                    <Link
                      href={`/download/${order.id}`}
                      className="inline-block rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                    >
                      Baixar
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
