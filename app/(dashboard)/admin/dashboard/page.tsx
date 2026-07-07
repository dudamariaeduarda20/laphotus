"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  photographersCount: number;
  totalPhotos: number;
  platformEarnings: number;
  transactionCount: number;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Falha ao carregar dados");

      const data = await res.json();
      setStats(data.stats);
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }

    fetchAdminData();
  }, [isAdmin, authLoading, router, fetchAdminData]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600 mt-2">
          Gestão global da plataforma, utilizadores e comissões
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Utilizadores Totais
          </div>
          <div className="text-4xl font-bold text-[#09419b] mt-2">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {stats?.photographersCount || 0} fotógrafos
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Fotos Processadas
          </div>
          <div className="text-4xl font-bold text-[#f0bf38] mt-2">
            {stats?.totalPhotos || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Comissões da Plataforma
          </div>
          <div className="text-4xl font-bold text-emerald-600 mt-2">
            € {(stats?.platformEarnings || 0).toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold">
            Transações Processadas
          </div>
          <div className="text-4xl font-bold text-purple-600 mt-2">
            {stats?.transactionCount || 0}
          </div>
        </div>
      </div>

      {/* Admin Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/photographers"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <div className="text-2xl mb-3">👨‍📸</div>
          <h3 className="font-bold text-gray-900">Gestão de Fotógrafos</h3>
          <p className="text-sm text-gray-600 mt-1">
            Aprovar/bloquear fotógrafos
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <div className="text-2xl mb-3">⚙️</div>
          <h3 className="font-bold text-gray-900">Configurações</h3>
          <p className="text-sm text-gray-600 mt-1">
            Comissões e parâmetros globais
          </p>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <div className="text-2xl mb-3">📋</div>
          <h3 className="font-bold text-gray-900">Logs de Auditoria</h3>
          <p className="text-sm text-gray-600 mt-1">
            Histórico de ações do sistema
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Atividade Recente</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {log.action.replace(/_/g, " ").toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {log.resource} - {log.resourceId}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleDateString("pt-PT")}{" "}
                  {new Date(log.createdAt).toLocaleTimeString("pt-PT")}
                </div>
              </div>
            </div>
          ))}
        </div>

        {logs.length === 0 && (
          <div className="p-12 text-center text-gray-600">
            Nenhuma atividade registada
          </div>
        )}
      </div>
    </div>
  );
}
