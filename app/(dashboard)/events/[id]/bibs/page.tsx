"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";

interface BibRow {
  id?: string;
  number: string;
  athleteName: string;
  athleteEmail: string;
}

function parseCsvPreview(text: string): BibRow[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((l) => {
      const cols = l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      return { number: cols[0] || "", athleteName: cols[1] || "", athleteEmail: cols[2] || "" };
    })
    .filter((r) => r.number);
}

export default function EventBibsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const fileRef = useRef<HTMLInputElement>(null);

  const [bibs, setBibs] = useState<BibRow[]>([]);
  const [loadingBibs, setLoadingBibs] = useState(true);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BibRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    updated: number;
    errors: string[];
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadBibs = async () => {
    setLoadingBibs(true);
    try {
      const r = await fetch(`/api/organizer/bibs?eventId=${eventId}`);
      const d = await r.json();
      setBibs(d.bibs || []);
    } finally {
      setLoadingBibs(false);
    }
  };

  useEffect(() => {
    loadBibs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setCsvFile(file);
    setResult(null);
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(parseCsvPreview(text));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-[#e8f0ff]");
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFileChange(file);
  };

  const handleUpload = async () => {
    if (!csvFile) return;
    setUploading(true);
    setUploadError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", csvFile);
      fd.append("eventId", eventId);
      const r = await fetch("/api/organizer/bibs", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Falha no upload");
      setResult(d);
      setCsvFile(null);
      setPreview([]);
      if (fileRef.current) fileRef.current.value = "";
      await loadBibs();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dorsais (Bibs)</h1>
          <p className="text-gray-600 text-sm mt-1">
            Carregue um CSV para associar dorsais a atletas neste evento.
          </p>
        </div>
        <Link
          href={`/events/${eventId}/edit`}
          className="text-sm text-[#09419b] hover:underline"
        >
          ← Editar evento
        </Link>
      </div>

      {/* Upload CSV */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Carregar CSV</h2>
        <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-50 p-2 rounded">
          number,athleteName,athleteEmail<br />
          42,João Silva,joao@ex.com<br />
          007,Maria Costa,<br />
          99,Bob,,
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-[#e8f0ff]"); }}
          onDragLeave={(e) => e.currentTarget.classList.remove("bg-[#e8f0ff]")}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <p className="text-gray-600 text-sm">
            {csvFile ? `📄 ${csvFile.name}` : "Arraste o CSV aqui ou clique para selecionar"}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Preview — {preview.length} linha{preview.length !== 1 ? "s" : ""}:
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-48">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Dorsal</th>
                    <th className="px-3 py-2 text-left font-semibold">Nome</th>
                    <th className="px-3 py-2 text-left font-semibold">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono font-bold">{r.number}</td>
                      <td className="px-3 py-2">{r.athleteName || "—"}</td>
                      <td className="px-3 py-2 text-gray-500">{r.athleteEmail || "—"}</td>
                    </tr>
                  ))}
                  {preview.length > 20 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-center text-gray-400">
                        +{preview.length - 20} linhas…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result / Error */}
        {result && (
          <div className="mt-4 p-3 bg-[#fef7e8] border border-green-200 rounded-lg text-sm text-green-800">
            ✓ {result.inserted} inserido{result.inserted !== 1 ? "s" : ""},{" "}
            {result.updated} atualizado{result.updated !== 1 ? "s" : ""}.
            {result.errors.length > 0 && (
              <ul className="mt-2 text-red-700 list-disc list-inside">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {uploadError}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!csvFile || uploading || preview.length === 0}
          className="mt-4 px-5 py-2 bg-[#09419b] text-white text-sm font-semibold rounded-lg hover:bg-[#09419b] disabled:opacity-50"
        >
          {uploading ? "A carregar…" : `Importar ${preview.length} dorsal${preview.length !== 1 ? "is" : ""}`}
        </button>
      </div>

      {/* Bibs table */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Dorsais registados{bibs.length > 0 ? ` (${bibs.length})` : ""}
          </h2>
        </div>
        {loadingBibs ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#09419b]"></div>
          </div>
        ) : bibs.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            Nenhum dorsal registado. Carregue um CSV acima.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-900">Dorsal</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-900">Nome</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-900">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bibs.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono font-bold">{b.number}</td>
                    <td className="px-5 py-3">{b.athleteName || <span className="text-gray-400">—</span>}</td>
                    <td className="px-5 py-3 text-gray-500">{b.athleteEmail || <span className="text-gray-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
