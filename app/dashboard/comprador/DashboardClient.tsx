"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Order, OrderItem, Photo } from "@prisma/client";
import FilterBar from "./FilterBar";
import PurchaseHistoryTable from "./PurchaseHistoryTable";

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    photo: Photo & {
      event: { id: string; title: string };
      photographer: { user: { name: string } };
    };
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
  const photographerFilter = searchParams.get("photographer") || "";
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

  // Extract unique photographers for filter dropdown
  const uniquePhotographers = useMemo(() => {
    const photographers = new Set<string>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        photographers.add(item.photo.photographer.user.name);
      });
    });
    return photographers;
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

      // Photographer filter
      if (photographerFilter) {
        const hasPhotographer = order.items.some(
          (item) => item.photo.photographer.user.name === photographerFilter
        );
        if (!hasPhotographer) {
          return false;
        }
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
  }, [orders, search, eventFilter, photographerFilter, dateFrom, dateTo]);

  return (
    <>
      <FilterBar events={uniqueEvents} photographers={uniquePhotographers} />

      {/* Results Count */}
      <div className="mb-6 text-sm text-[#666]">
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
