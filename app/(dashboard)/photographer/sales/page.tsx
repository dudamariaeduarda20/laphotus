"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import PhotographerTabs from "@/components/PhotographerTabs";
import SalesBarChart from "./SalesBarChart";
import CumulativeLineChart from "./CumulativeLineChart";
import ExportCsvButton from "./ExportCsvButton";

interface SaleEntry {
  photoId: string;
  photoName: string;
  eventTitle: string;
  price: number;
  orderId: string;
  createdAt: string;
  buyerName: string;
}

interface SalesData {
  totalRevenue: number;
  totalSales: number;
  photosForSale: number;
  eventsCount: number;
  thisMonth: number;
  salesByDay: { date: string; count: number; revenue: number }[];
  cumulative: { date: string; total: number }[];
  recentSales: SaleEntry[];
}

export default function PhotographerSalesPage() {
  const { isPhotographer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isPhotographer) {
      router.push("/dashboard");
      return;
    }

    const fetchSales = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/photographer/sales");
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Falha ao carregar vendas");
        }
        setData(await res.json());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar vendas");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [isPhotographer, authLoading, router]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        {error}
      </div>
    );
  }

  const hasSales = (data?.totalSales ?? 0) > 0;

  return (
    <div>
      <PhotographerTabs />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Vendas</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Fotos Vendidas</p>
          <h2 className="text-3xl font-bold text-[#09419b]">
            {data?.totalSales ?? 0}
          </h2>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Dinheiro Ganho</p>
          <h2 className="text-3xl font-bold text-[#f0bf38]">
            € {(data?.totalRevenue ?? 0).toFixed(2)}
          </h2>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Fotos Publicadas</p>
          <h2 className="text-3xl font-bold text-gray-900">
            {data?.photosForSale ?? 0}
          </h2>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Eventos Participados</p>
          <h2 className="text-3xl font-bold text-gray-900">
            {data?.eventsCount ?? 0}
          </h2>
        </div>
      </div>

      {!hasSales ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-lg text-gray-700 mb-2">
            Ainda não tem vendas registadas.
          </p>
          <p className="text-sm text-gray-500">
            Assim que as suas fotos forem compradas, o desempenho aparece aqui.
          </p>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Vendas — Últimos 30 dias
              </h2>
              <SalesBarChart data={data!.salesByDay} />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Ganhos Acumulados — Últimos 30 dias
              </h2>
              <CumulativeLineChart data={data!.cumulative} />
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Últimas Vendas
              </h2>
              <ExportCsvButton rows={data!.recentSales} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Foto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Comprador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data!.recentSales.map((sale) => (
                    <tr key={`${sale.orderId}-${sale.photoId}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {sale.photoName}
                        <p className="text-xs text-gray-500">{sale.eventTitle}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sale.buyerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(sale.createdAt).toLocaleDateString("pt-PT")}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-[#f0bf38]">
                        € {sale.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
