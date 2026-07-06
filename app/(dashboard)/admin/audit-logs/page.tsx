"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
}

export default function AuditLogs() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/audit-logs");
      if (!res.ok) throw new Error("Falha ao carregar");

      const { logs } = await res.json();
      setLogs(logs);
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

    fetchLogs();
  }, [isAdmin, authLoading, router, fetchLogs]);

  const filteredLogs = filterAction
    ? logs.filter((log) => log.action === filterAction)
    : logs;

  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Logs de Auditoria
        </h1>
        <p className="text-gray-600 mt-2">
          Histórico completo de ações do sistema
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Filtrar por Ação
        </label>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full md:w-64"
        >
          <option value="">Todas as ações</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {action.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Utilizador
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Recurso
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  ID do Recurso
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Data/Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.userName}
                    <div className="text-xs text-gray-500">{log.userEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {log.resourceId ? log.resourceId.substring(0, 12) + "..." : "—"}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      {new Date(log.createdAt).toLocaleDateString("pt-PT")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleTimeString("pt-PT")}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-gray-600">
            Nenhum log encontrado
          </div>
        )}
      </div>
    </div>
  );
}
