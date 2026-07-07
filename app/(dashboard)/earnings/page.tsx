"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import PhotographerTabs from "@/components/PhotographerTabs";

export default function EarningsPage() {
  const { user, isPhotographer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);

  const handleWithdraw = async () => {
    const available = earnings?.totalEarnings || 0;
    if (available <= 0) {
      setWithdrawMsg("Sem saldo disponível para saque.");
      return;
    }
    setWithdrawing(true);
    setWithdrawMsg(null);
    try {
      const res = await fetch("/api/photographer/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: available }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao solicitar saque");
      setWithdrawMsg(
        `✓ Pedido de saque de € ${available.toFixed(2)} registado. O admin vai processar.`
      );
    } catch (err) {
      setWithdrawMsg(
        err instanceof Error ? err.message : "Falha ao solicitar saque"
      );
    } finally {
      setWithdrawing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isPhotographer) {
      router.push("/dashboard");
      return;
    }

    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/photographer/earnings");
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Falha ao carregar ganhos");
        }
        const data = await res.json();
        setEarnings(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar ganhos");
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
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

  return (
    <div>
      <PhotographerTabs />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Meus Ganhos</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Earnings */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Acumulado</p>
          <h2 className="text-4xl font-bold text-[#f0bf38] mb-2">
            € {earnings?.totalEarnings.toFixed(2) || "0.00"}
          </h2>
          <p className="text-sm text-gray-600">
            De {earnings?.totalOrders || 0} vendas
          </p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Este Mês</p>
          <h2 className="text-4xl font-bold text-[#09419b] mb-2">
            € {earnings?.thisMonth.toFixed(2) || "0.00"}
          </h2>
          <p className="text-sm text-gray-600">Rendimento mensal</p>
        </div>

        {/* Platform Commission */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Comissão Plataforma</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {Math.round((earnings?.commissionRate ?? 0.2) * 100)}%
          </h2>
          <p className="text-sm text-gray-600">
            Você recebe {Math.round((earnings?.payoutShare ?? 0.8) * 100)}% por venda
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Histórico de Transações</h2>
        </div>

        {earnings?.transactions && earnings.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                    Encomenda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                    Montante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                    Comissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                    Recebido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {earnings.transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tx.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{tx.orderId.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      € {tx.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      -€ {tx.commission.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#f0bf38]">
                      € {tx.photographerPayout.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-600">
            <p>Sem transações ainda. Quando suas fotos forem vendidas, elas aparecerão aqui!</p>
          </div>
        )}
      </div>

      {/* Saque */}
      <div className="mt-8 bg-[#fef7e8] border border-green-200 rounded-lg p-6">
        <h3 className="font-bold text-green-900 mb-1">💰 Saque</h3>
        <p className="text-sm text-green-800 mb-1">
          Saldo disponível:{" "}
          <span className="font-bold">
            € {(earnings?.totalEarnings || 0).toFixed(2)}
          </span>
        </p>
        <p className="text-xs text-[#f0bf38] mb-4">
          O pedido é registado e processado manualmente pelo admin.
        </p>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing || (earnings?.totalEarnings || 0) <= 0}
          className="px-4 py-2 bg-[#f0bf38] text-white rounded-lg hover:bg-[#f0bf38] text-sm font-semibold disabled:opacity-50"
        >
          {withdrawing ? "A solicitar…" : "Solicitar saque"}
        </button>
        {withdrawMsg && (
          <p
            className={`mt-3 text-sm ${
              withdrawMsg.startsWith("✓") ? "text-[#f0bf38]" : "text-red-600"
            }`}
          >
            {withdrawMsg}
          </p>
        )}
      </div>

      {/* Bank Info */}
      <div className="mt-6 bg-[#e8f0ff] border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">💳 Informações Bancárias</h3>
        <p className="text-sm text-blue-800">
          Conta bancária:{" "}
          <span className="font-medium">
            {user?.name ? "configurada no perfil" : "—"}
          </span>{" "}
          · pagamentos processados manualmente.
        </p>
      </div>
    </div>
  );
}
