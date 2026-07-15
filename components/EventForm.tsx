"use client";

import { useState } from "react";
import { uploadEventBanner } from "@/lib/services/eventBannerUpload";

interface EventFormProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

const DEFAULT_EVENT_COVER = "/images/default-event-cover.jpg";

export default function EventForm({
  onSubmit,
  initialData,
  isLoading = false,
}: EventFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    date: initialData?.date
      ? new Date(initialData.date).toISOString().slice(0, 16)
      : "",
    location: initialData?.location || "",
    sport: initialData?.sport || "",
    banner: initialData?.banner || "",
  });

  const [error, setError] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const displayBanner = formData.banner || previewUrl || DEFAULT_EVENT_COVER;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setBannerUploading(true);

    try {
      const url = await uploadEventBanner(file);
      setFormData((prev) => ({ ...prev, banner: url }));
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao fazer upload da imagem");
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título do Evento *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Copa Regional 2026"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Desporto *
        </label>
        <select
          name="sport"
          value={formData.sport}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione desporto...</option>
          <option value="Futebol">Futebol</option>
          <option value="Vôlei">Voleibol</option>
          <option value="Basquete">Basquetebol</option>
          <option value="Natação">Natação</option>
          <option value="Atletismo">Atletismo</option>
          <option value="Ciclismo">Ciclismo</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data do Evento *
        </label>
        <input
          type="datetime-local"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Localização
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Estádio Municipal, Lisboa"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Detalhes do evento..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagem do Banner
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            disabled={bannerUploading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {bannerUploading && (
            <div className="flex items-center gap-2">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#09419b]"></div>
              <span className="text-sm text-gray-600">Enviando...</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {formData.banner
            ? "Imagem carregada"
            : "Clique para escolher uma imagem (máx. 5MB)"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pré-visualização da Capa
        </label>
        <img
          src={displayBanner}
          alt="Pré-visualização do banner do evento"
          className="w-full h-48 object-cover rounded-lg bg-gray-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_EVENT_COVER;
          }}
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] disabled:opacity-50"
        >
          {isLoading ? "A guardar..." : initialData ? "Atualizar Evento" : "Criar Evento"}
        </button>
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          onClick={() => window.history.back()}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
