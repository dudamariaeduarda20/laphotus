"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFaceDescriptor } from "@/lib/faceApi";

interface PhotoUploadProps {
  eventId: string;
  onUploadSuccess?: () => void;
}

export default function PhotoUpload({
  eventId,
  onUploadSuccess,
}: PhotoUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  const [prices, setPrices] = useState<{ [key: string]: number }>({});
  const [premiums, setPremiums] = useState<{ [key: string]: boolean }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
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
    const newFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    const newProgress = { ...uploadProgress };
    delete newProgress[fileName];
    setUploadProgress(newProgress);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Select files to upload");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        const fileProgress = { ...uploadProgress };
        fileProgress[file.name] = 0;
        setUploadProgress(fileProgress);

        // Reconhecimento facial REAL: extrai descritor 128-D no browser
        let faceDescriptor: number[] | null = null;
        try {
          faceDescriptor = await getFaceDescriptor(file);
        } catch (e) {
          console.warn("Falha ao extrair rosto de", file.name, e);
        }

        // Real upload: send FormData with actual file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("eventId", eventId);
        formData.append("fileName", file.name);
        formData.append("price", String(prices[file.name] || 0));
        formData.append("isPremium", String(premiums[file.name] || false));
        if (faceDescriptor) {
          formData.append("faceDescriptor", JSON.stringify(faceDescriptor));
        }

        const response = await fetch("/api/photos", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        // Simulate progress
        fileProgress[file.name] = 100;
        setUploadProgress(fileProgress);
      }

      setFiles([]);
      setPrices({});
      setPremiums({});
      setUploadProgress({});

      if (onUploadSuccess) {
        onUploadSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

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

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900">
            {files.length} ficheiro{files.length !== 1 ? "s" : ""} pronto{files.length !== 1 ? "s" : ""} para carregar
          </h3>

          {files.map((file) => (
            <div key={file.name} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.name)}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Remover
                </button>
              </div>

              {/* Progress */}
              {uploadProgress[file.name] !== undefined && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${uploadProgress[file.name]}%`,
                    }}
                  ></div>
                </div>
              )}

              {/* Price & Premium */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices[file.name] || ""}
                    onChange={(e) =>
                      setPrices({
                        ...prices,
                        [file.name]: parseFloat(e.target.value) || 0,
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
                      checked={premiums[file.name] || false}
                      onChange={(e) =>
                        setPremiums({
                          ...premiums,
                          [file.name]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Premium
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "A carregar..." : `Carregar ${files.length} Foto${files.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
        <p className="font-semibold mb-2">💡 Dicas:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Suporta JPG, PNG, WEBP (máx. 10MB cada)</li>
          <li>Defina preço como 0 para fotos grátis</li>
          <li>Marque fotos premium para preços especiais</li>
          <li>Fotos automaticamente marcadas com marca d'água</li>
        </ul>
      </div>
    </div>
  );
}
