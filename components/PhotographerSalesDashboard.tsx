"use client";

import { useEffect, useState } from "react";

interface SalesByDay {
  date: string;
  count: number;
  revenue: number;
}
interface Stats {
  totalRevenue: number;
  totalSales: number;
  photosForSale: number;
  pendingPayout: number;
  thisMonth: number;
  salesByDay: SalesByDay[];
}

const eur = (n: number) =>
  `€ ${n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Gráfico de barras inline (SVG, sem dependências) — receita por dia (30d). */
function MiniBarChart({ data }: { data: SalesByDay[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const W = 720;
  const H = 160;
  const gap = 2;
  const bw = (W - gap * (data.length - 1)) / data.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-40"
      preserveAspectRatio="none"
      role="img"
      aria-label="Receita por dia nos últimos 30 dias"
    >
      {data.map((d, i) => {
        const h = (d.revenue / max) * (H - 20);
        const x = i * (bw + gap);
        const y = H - h;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={bw}
              height={h}
              rx={2}
              className="fill-blue-500"
            >
              <title>
                {d.date}: {eur(d.revenue)} ({d.count} venda
                {d.count !== 1 ? "s" : ""})
              </title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent || "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

export default function PhotographerSalesDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/photographer/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Falha");
        return r.json();
      })
      .then((d) => active && setStats(d.stats))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mb-8 text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error || !stats) {
    return (
      <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
        Não foi possível carregar as estatísticas{error ? `: ${error}` : ""}.
      </div>
    );
  }

  const hasSales = stats.totalSales > 0;

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Vendas</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card label="Receita total" value={eur(stats.totalRevenue)} accent="text-green-600" />
        <Card label="Vendas" value={String(stats.totalSales)} />
        <Card label="Fotos à venda" value={String(stats.photosForSale)} />
        <Card
          label="Disponível p/ saque"
          value={eur(stats.pendingPayout)}
          accent="text-blue-600"
        />
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            Receita — últimos 30 dias
          </h3>
          <span className="text-sm text-gray-500">
            Este mês: {eur(stats.thisMonth)}
          </span>
        </div>
        {hasSales ? (
          <MiniBarChart data={stats.salesByDay} />
        ) : (
          <div className="py-10 text-center text-gray-400 text-sm">
            Ainda sem vendas. As suas vendas aparecerão aqui.
          </div>
        )}
      </div>
    </div>
  );
}
