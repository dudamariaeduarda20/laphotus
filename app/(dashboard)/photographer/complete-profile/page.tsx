"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";

const COUNTRIES = [
  "Portugal", "Espanha", "França", "Itália", "Alemanha", "Bélgica", "Holanda",
  "Áustria", "Suíça", "Suécia", "Noruega", "Dinamarca", "Finlândia", "Polónia",
  "República Checa", "Eslováquia", "Hungria", "Roménia", "Bulgária", "Grécia",
];

export default function CompletePhotographerProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    country: "Portugal",
    postalCode: "",
    address: "",
    addressNumber: "",
    complement: "",
    city: "",
    state: "",
    taxPayerId: "",
    vat: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/photographers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      router.push("/photographer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dados bancários + informações fiscais</h1>
      <p className="text-gray-600 mb-8">
        Preencha as informações necessárias para começar a vender fotos e receber pagamentos
      </p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* País */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              País <span className="text-red-500">*</span>
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Código Postal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código Postal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="Digite o Código Postal"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Digite o Endereço"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* Número */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
            <input
              type="text"
              name="addressNumber"
              value={formData.addressNumber}
              onChange={handleChange}
              placeholder="Digite o Número"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Complemento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
            <input
              type="text"
              name="complement"
              value={formData.complement}
              onChange={handleChange}
              placeholder="Digite o Complemento"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Digite a Cidade"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Digite o Estado"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Tax Payer ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Payer ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="taxPayerId"
              value={formData.taxPayerId}
              onChange={handleChange}
              placeholder="Digite o Tax Payer ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* VAT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">VAT</label>
          <input
            type="text"
            name="vat"
            value={formData.vat}
            onChange={handleChange}
            placeholder="Digite o VAT"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Stripe Connection */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-4">
            Você precisa conectar sua conta do Stripe para poder receber os pagamentos
          </p>
          <button
            type="button"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Conectar
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium"
          >
            {loading ? "Salvando..." : "SALVAR"}
          </button>
        </div>
      </form>
    </div>
  );
}
