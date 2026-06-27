"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFaceDescriptor } from "@/lib/faceApi";

interface PhotoUploadProps {
  eventId: string;
  onUploadSuccess?: () => void;
}

type FileStatus = "pending" | "uploading" | "done" | "error";

interface QueueItem {
  uid: string; // id estável (evita colisão de nomes iguais)
  file: File;
  price: number;
  premium: boolean;
  status: FileStatus;
  errorMsg?: string;
}

let _uid = 0;
const nextUid = () => `f${Date.now()}_${_uid++}`;

const STATUS_ICON: Record<FileStatus, string> = {
  pending: "🕐",
  uploading: "⬆️",
  done: "✅",
  error: "❌",
};
const STATUS_LABEL: Record<FileStatus, string> = {
  pending: "Pendente",
  uploading: "A enviar…",
  done: "Concluído",
  error: "Falhou",
};

export default function PhotoUpload({
  eventId,
  onUploadSuccess,
}: PhotoUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);

  // Preço/premium em massa
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [bulkPremium, setBulkPremium] = useState(false);

  const addFiles = (fileList: FileList | File[]) => {
    const added = Array.from(fileList).map<QueueItem>((file) => ({
      uid: nextUid(),
      file,
      price: 0,
      premium: false,
      status: "pending",
    }));
    setItems((prev) => [...prev, ...added]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = ""; // permite re-selecionar o mesmo ficheiro
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-blue-50");
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-blue-50");
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-blue-50");
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeItem = (uid: string) =>
    setItems((prev) => prev.filter((i) => i.uid !== uid));

  const patch = (uid: string, p: Partial<QueueItem>) =>
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, ...p } : i)));

  const handleUpload = async () => {
    if (items.length === 0) {
      setError("Selecione ficheiros para carregar");
      return;
    }
    setUploading(true);
    setError(null);

    let okCount = 0;
    let failCount = 0;

    for (const item of items) {
      // Já concluídos não voltam a subir (permite re-tentar só os que falharam)
      if (item.status === "done") {
        okCount++;
        continue;
      }
      patch(item.uid, { status: "uploading", errorMsg: undefined });

      const price = bulkMode ? bulkPrice : item.price;
      const premium = bulkMode ? bulkPremium : item.premium;

      try {
        // Reconhecimento facial REAL (descritor 128-D no browser) — best-effort
        let faceDescriptor: number[] | null = null;
        try {
          faceDescriptor = await getFaceDescriptor(item.file);
        } catch (e) {
          console.warn("Falha ao extrair rosto de", item.file.name, e);
        }

        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("eventId", eventId);
        formData.append("fileName", item.file.name);
        formData.append("price", String(price || 0));
        formData.append("isPremium", String(premium));
        if (faceDescriptor) {
          formData.append("faceDescriptor", JSON.stringify(faceDescriptor));
        }

        const response = await fetch("/api/photos", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Erro ${response.status}`);
        }

        patch(item.uid, { status: "done" });
        okCount++;
      } catch (err) {
        // Erro isolado: marca esta foto e continua o lote
        patch(item.uid, {
          status: "error",
          errorMsg: err instanceof Error ? err.message : "Falha no envio",
        });
        failCount++;
      }
    }

    setUploading(false);

    if (failCount === 0) {
      // Tudo ok — limpa a fila e atualiza
      setItems([]);
      if (onUploadSuccess) onUploadSuccess();
      else router.refresh();
    } else {
      setError(
        `${okCount} enviada(s), ${failCount} falhada(s). As que falharam ficam na lista para tentar de novo.`
      );
      // Remove as concluídas, mantém só as falhadas para re-tentar
      setItems((prev) => prev.filter((i) => i.status !== "done"));
      if (okCount > 0 && !onUploadSuccess) router.refresh();
    }
  };

  const pendingCount = items.filter((i) => i.status !== "done").length;

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Carregar Fotos</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
          {error}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition mb-6"
      >
        <div className="text-6xl mb-4">📸</div>
        <p className="text-lg font-semibold text-gray-900 mb-2">
          Arraste e solte fotos aqui
        </p>
        <p className="text-gray-600 mb-4">ou</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Selecionar Ficheiros
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Preço em massa */}
      {items.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={bulkMode}
              onChange={(e) => setBulkMode(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="font-medium text-gray-800">
              Aplicar preço a todas as fotos
            </span>
          </label>
          {bulkMode && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço para todas (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkPrice || ""}
                  onChange={(e) => setBulkPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkPremium}
                    onChange={(e) => setBulkPremium(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Todas Premium
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File List */}
      {items.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900">
            {items.length} ficheiro{items.length !== 1 ? "s" : ""} na fila
          </h3>

          {items.map((item) => (
            <div key={item.uid} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Estado por-foto */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${
                      item.status === "error"
                        ? "text-red-600"
                        : item.status === "done"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {STATUS_ICON[item.status]} {STATUS_LABEL[item.status]}
                  </span>
                  {!uploading && item.status !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.uid)}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              {item.status === "error" && item.errorMsg && (
                <p className="text-sm text-red-600 mb-3">{item.errorMsg}</p>
              )}

              {/* Preço & Premium individuais (ocultos em modo massa) */}
              {!bulkMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price || ""}
                      onChange={(e) =>
                        patch(item.uid, {
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.premium}
                        onChange={(e) =>
                          patch(item.uid, { premium: e.target.checked })
                        }
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Premium
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || pendingCount === 0}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading
              ? "A enviar…"
              : `Carregar ${pendingCount} Foto${pendingCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
        <p className="font-semibold mb-2">💡 Dicas:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Suporta JPG, PNG, WEBP (máx. 10MB cada)</li>
          <li>Defina preço como 0 para fotos grátis</li>
          <li>Use &quot;aplicar a todas&quot; para definir um preço único</li>
          <li>Se uma foto falhar, as outras continuam — tente a falhada de novo</li>
        </ul>
      </div>
    </div>
  );
}
