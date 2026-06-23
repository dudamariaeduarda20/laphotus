"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function AdminSettings() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [commissionRate, setCommissionRate] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }

    fetchSettings();
  }, [isAdmin, authLoading, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Falha ao carregar");

      const data = await res.json();
      setCommissionRate(data.commissionRate * 100);
      setEarnings(data.earnings);
      setHistory(data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRate = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: commissionRate / 100 }),
      });

      if (!res.ok) throw new Error("Falha ao guardar");

      setSuccess("Taxa de comissão atualizada com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Configurações da Plataforma
        </h1>
        <p className="text-gray-600 mt-2">
          Comissões e parâmetros globais
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✓ {success}
        </div>
      )}

      {/* Commission Rate */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Taxa de Comissão Padrão
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comissão da Plataforma (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg w-24 text-center text-lg font-bold"
              />
              <span className="text-gray-600">%</span>
              <span className="text-sm text-gray-500 ml-4">
                Valor atualmente: {commissionRate}% (fotógrafo recebe{" "}
                {100 - commissionRate}%)
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveRate}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {saving ? "A guardar..." : "Guardar Alterações"}
            </button>
          </div>
        </div>
      </div>

      {/* Platform Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Comissões Totais
          </div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            € {(earnings?.totalEarnings || 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {earnings?.transactionCount || 0} transações processadas
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Pago aos Fotógrafos
          </div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            € {(earnings?.totalPhotographerPayout || 0).toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Total Processado
          </div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            € {(earnings?.totalProcessed || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Commission History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Histórico de Comissões
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Fotógrafo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Valor Venda
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Comissão (Plataforma)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Pago ao Fotógrafo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {item.photographerName}
                  </td>
                  <td className="px-6 py-4 text-green-600 font-semibold">
                    € {item.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-red-600 font-semibold">
                    € {item.commission.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-blue-600 font-semibold">
                    € {item.photographerPayout.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(item.createdAt).toLocaleDateString("pt-PT")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.length === 0 && (
          <div className="p-12 text-center text-gray-600">
            Nenhuma transação processada ainda
          </div>
        )}
      </div>
    </div>
  );
}
