"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function PhotographerDashboard() {
  const router = useRouter();
  const { user, isPhotographer } = useAuth();
  const { t } = useTranslation();
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPhotographer) {
      router.push("/dashboard");
      return;
    }

    // Check if profile is complete
    const checkProfile = async () => {
      try {
        const res = await fetch("/api/photographers/profile");
        const data = await res.json();
        setProfileComplete(data.isComplete || false);
      } catch (err) {
        console.error("Error checking profile:", err);
        setProfileComplete(false);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [isPhotographer, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
      </div>
    );
  }

  const completionPercentage = profileComplete ? 100 : 60;

  return (
    <div className="space-y-6">
      {/* Completion Banner */}
      {!profileComplete && (
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-900 font-medium text-center flex-1">Ei, você ainda não preencheu todo seu cadastro.</p>
            <Link
              href="/photographer/complete-profile"
              className="px-8 py-2 border-2 border-gray-900 text-gray-900 rounded-full hover:bg-gray-50 transition font-semibold whitespace-nowrap ml-4"
            >
              COMPLETAR CADASTRO
            </Link>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3 mt-4">
            <div
              className="bg-red-500 h-3 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-center text-white font-bold text-sm mt-2" style={{ position: 'absolute', marginLeft: '45%', marginTop: '-20px' }}>
            {completionPercentage}%
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meu Extrato */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Meu Extrato</h2>
            <button className="text-gray-400 hover:text-gray-600">👁️</button>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Total de pedidos no mês</span>
              <span className="font-medium text-gray-900">0</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Fotos vendidas no mês</span>
              <span className="font-medium text-gray-900">0</span>
            </div>
            <div className="flex justify-between items-center pb-3">
              <span className="text-gray-600">Vídeos vendidos no mês</span>
              <span className="font-medium text-gray-900">0</span>
            </div>
          </div>

          <div className="bg-gray-100 rounded p-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Faturamento no mês</span>
              <span className="font-bold text-gray-900">€ 0,00</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Atualizado em: {new Date().toLocaleDateString("pt-PT")} {new Date().toLocaleTimeString("pt-PT")}
            <br />
            Próxima atualização em 1 min
          </p>
        </div>

        {/* Meus Eventos */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-orange-500 flex items-center gap-2">
              📅 Meus Eventos
            </h2>
            <Link
              href="/photographer/create-event"
              className="flex items-center justify-center w-12 h-12 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
            >
              +
            </Link>
          </div>

          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Nenhum Evento Próximo</p>
            <Link
              href="/photographer/suggest-event"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Sugerir novo evento
            </Link>
          </div>

          <Link
            href="/photographer/events"
            className="block w-full mt-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-center font-medium"
          >
            Ver todos →
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/photographer/earnings"
          className="bg-white rounded-lg p-6 text-center hover:shadow-md transition"
        >
          <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">💵</span>
          </div>
          <p className="text-xs font-medium text-gray-600">Ganhos</p>
        </Link>
        <Link
          href="/photographer/sales"
          className="bg-white rounded-lg p-6 text-center hover:shadow-md transition"
        >
          <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🛒</span>
          </div>
          <p className="text-xs font-medium text-gray-600">Vendas</p>
        </Link>
        <Link
          href="/photographer/settings"
          className="bg-white rounded-lg p-6 text-center hover:shadow-md transition"
        >
          <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">⚙️</span>
          </div>
          <p className="text-xs font-medium text-gray-600">Configurações</p>
        </Link>
        <Link
          href="/photographer/marketing"
          className="bg-white rounded-lg p-6 text-center hover:shadow-md transition"
        >
          <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">📣</span>
          </div>
          <p className="text-xs font-medium text-gray-600">Marketing</p>
        </Link>
      </div>
    </div>
  );
}
