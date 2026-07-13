"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Order, OrderItem, Photo } from "@prisma/client";
import FilterBar from "./FilterBar";
import PurchaseHistoryTable from "./PurchaseHistoryTable";

interface OrderWithItems extends Order {
  items: (OrderItem & {
    photo: Photo & { event: { title: string } };
  })[];
}

interface DashboardClientProps {
  orders: OrderWithItems[];
}

export default function DashboardClient({ orders }: DashboardClientProps) {
  const searchParams = useSearchParams();

  // Get filter values from URL
  const search = searchParams.get("search") || "";
  const eventFilter = searchParams.get("event") || "";
  const statusFilter = searchParams.get("status") || "";
  const dateFrom = searchParams.get("dateFrom")
    ? new Date(searchParams.get("dateFrom")!)
    : null;
  const dateTo = searchParams.get("dateTo")
    ? new Date(searchParams.get("dateTo")!)
    : null;

  // Extract unique events for filter dropdown
  const uniqueEvents = useMemo(() => {
    const events = new Set<string>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        events.add(item.photo.event.title);
      });
    });
    return events;
  }, [orders]);

  // Extract unique statuses
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(orders.map((o) => o.status));
    return Array.from(statuses).sort();
  }, [orders]);

  // Apply filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter (by event name)
      if (search) {
        const eventNames = order.items
          .map((item) => item.photo.event.title.toLowerCase())
          .join(" ");
        if (!eventNames.includes(search.toLowerCase())) {
          return false;
        }
      }

      // Event filter
      if (eventFilter) {
        const hasEvent = order.items.some(
          (item) => item.photo.event.title === eventFilter
        );
        if (!hasEvent) {
          return false;
        }
      }

      // Status filter
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }

      // Date range filter
      const orderDate = new Date(order.createdAt);
      if (dateFrom && orderDate < dateFrom) {
        return false;
      }
      if (dateTo) {
        const dateToEnd = new Date(dateTo);
        dateToEnd.setHours(23, 59, 59, 999);
        if (orderDate > dateToEnd) {
          return false;
        }
      }

      return true;
    });
  }, [orders, search, eventFilter, statusFilter, dateFrom, dateTo]);

  return (
    <>
      <FilterBar events={uniqueEvents} statuses={uniqueStatuses} />

      {/* Results Count */}
      <div className="mb-6 text-sm text-slate-600">
        {filteredOrders.length > 0 ? (
          <>
            Mostrando <strong>{filteredOrders.length}</strong> de{" "}
            <strong>{orders.length}</strong> compras
          </>
        ) : (
          "Nenhuma compra encontrada com os filtros selecionados"
        )}
      </div>

      <PurchaseHistoryTable orders={filteredOrders} />
    </>
  );
}
