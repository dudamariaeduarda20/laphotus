"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DownloadsPage() {
  const { isClient, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isClient) {
      router.push("/dashboard");
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error(t("downloads.err.load"));

        const { orders } = await res.json();
        setOrders(orders.filter((o: any) => o.status === "COMPLETED"));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("downloads.err.generic"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isClient, authLoading, router]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("dashboard.myDownloads")}</h1>
      <p className="text-gray-600 mb-8">{t("downloads.subtitle")}</p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t("downloads.empty.title")}
          </h2>
          <p className="text-gray-600 mb-6">
            {t("downloads.empty.desc")}
          </p>
          <Link
            href="/photos"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t("dashboard.searchPhotos")}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {t("downloads.order")} #{order.id.substring(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.paidAt).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    € {order.total.toFixed(2)}
                  </div>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    {t("success.order.paid")}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">{t("downloads.photos")}</h4>
                <div className="space-y-2">
                  {order.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.photo.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          € {item.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          // Gated download — server verifies paid order
                          try {
                            const res = await fetch(`/api/download/${item.photo.id}`);
                            const data = await res.json();
                            if (!res.ok) {
                              alert(data.error || t("downloads.err.noPerm"));
                              return;
                            }
                            const link = document.createElement("a");
                            link.href = data.url;
                            link.download = `${data.name}.jpg`;
                            link.target = "_blank";
                            link.click();
                          } catch {
                            alert(t("downloads.err.download"));
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        ⬇ {t("downloads.download")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>{t("cart.subtotal")}</span>
                  <span>€ {order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t("checkout.discount")}:</span>
                    <span>-€ {order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t("cart.vat")}</span>
                  <span>€ {order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 mt-2 pt-2 border-t border-gray-200">
                  <span>{t("cart.total")}</span>
                  <span>€ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
