"use client";

import type { PlatformAnalytics } from "@/lib/services/adminAnalyticsService";

interface Props {
  data: PlatformAnalytics;
}

function escapeCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function toCsv(data: PlatformAnalytics): string {
  const lines: string[] = [];

  lines.push("Resumo da Plataforma");
  lines.push(["Métrica", "Valor"].map(escapeCell).join(","));
  lines.push(["Total de Vendas", data.totalSales].map(escapeCell).join(","));
  lines.push(["Receita Bruta (EUR)", data.grossRevenue.toFixed(2)].map(escapeCell).join(","));
  lines.push(["Comissão da Plataforma (EUR)", data.platformCommission.toFixed(2)].map(escapeCell).join(","));
  lines.push(["Utilizadores Ativos (30d)", data.activeUsers].map(escapeCell).join(","));
  lines.push(["Fotos Publicadas", data.totalPhotos].map(escapeCell).join(","));
  lines.push("");

  lines.push("Top Fotógrafos");
  lines.push(["Fotógrafo", "Vendas", "Receita (EUR)"].map(escapeCell).join(","));
  for (const p of data.topPhotographers) {
    lines.push([p.name, p.salesCount, p.revenue.toFixed(2)].map(escapeCell).join(","));
  }
  lines.push("");

  lines.push("Top Eventos");
  lines.push(["Evento", "Fotos Vendidas", "Receita (EUR)"].map(escapeCell).join(","));
  for (const e of data.topEvents) {
    lines.push([e.title, e.photosSold, e.revenue.toFixed(2)].map(escapeCell).join(","));
  }

  return lines.join("\n");
}

export default function ExportReportButton({ data }: Props) {
  const handleExport = () => {
    const csv = toCsv(data);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-plataforma-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="rounded-lg bg-[#09419b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#09419b]/90"
    >
      ⬇ Exportar Relatório CSV
    </button>
  );
}
