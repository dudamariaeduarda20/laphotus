"use client";

interface SaleRow {
  photoName: string;
  buyerName: string;
  createdAt: string;
  price: number;
}

interface Props {
  rows: SaleRow[];
}

function toCsv(rows: SaleRow[]): string {
  const header = ["Foto", "Comprador", "Data", "Valor (EUR)"];
  const lines = rows.map((r) =>
    [
      r.photoName,
      r.buyerName,
      new Date(r.createdAt).toLocaleDateString("pt-PT"),
      r.price.toFixed(2),
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

export default function ExportCsvButton({ rows }: Props) {
  const handleExport = () => {
    const csv = toCsv(rows);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vendas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={rows.length === 0}
      className="rounded-lg bg-[#09419b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#09419b]/90 disabled:opacity-50"
    >
      ⬇ Exportar CSV
    </button>
  );
}
