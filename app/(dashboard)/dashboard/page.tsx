"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isPhotographer, isOrganizer, isClient } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel</h1>
      <p className="text-gray-600 mb-8">Bem-vindo novamente, {user?.name}!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Photographer Card */}
        {isPhotographer && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              📸 Ferramentas do Fotógrafo
            </h2>
            <div className="space-y-3">
              <Link
                href="/upload"
                className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition"
              >
                Carregar Fotos
              </Link>
              <Link
                href="/my-photos"
                className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition"
              >
                Minhas Fotos
              </Link>
              <Link
                href="/earnings"
                className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition"
              >
                💰 Meus Ganhos
              </Link>
            </div>
          </div>
        )}

        {/* Organizer Card */}
        {isOrganizer && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              🎯 Ferramentas do Organizador
            </h2>
            <div className="space-y-3">
              <Link
                href="/events"
                className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition"
              >
                Meus Eventos
              </Link>
              <Link
                href="/events/new"
                className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition"
              >
                Criar Evento
              </Link>
              <Link
                href="/photos"
                className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition"
              >
                Procurar Eventos
              </Link>
            </div>
          </div>
        )}

        {/* Client Card */}
        {isClient && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              🛍️ Compras
            </h2>
            <div className="space-y-3">
              <Link
                href="/photos"
                className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition"
              >
                Procurar Fotos
              </Link>
              <Link
                href="/downloads"
                className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition"
              >
                ⬇ Minhas Transferências
              </Link>
              <Link
                href="/downloads"
                className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition"
              >
                Minhas Encomendas
              </Link>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ Configurações</h2>
          <div className="space-y-3">
            <Link
              href="/profile"
              className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition"
            >
              Editar Perfil
            </Link>
            <Link
              href="/profile"
              className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition"
            >
              Conta
            </Link>
          </div>
        </div>
      </div>

      {/* User Role Badge */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600">
          Tipo de Conta:{" "}
          <span className="font-bold text-blue-600 text-lg">{user?.role}</span>
        </p>
      </div>
    </div>
  );
}
