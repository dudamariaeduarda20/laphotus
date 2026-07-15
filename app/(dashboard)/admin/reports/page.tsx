"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

interface ReportRow {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  photo: {
    id: string;
    name: string;
    status: string;
    photographer: { user: { id: string; name: string; banned: boolean } };
  };
  reporter: { id: string; name: string; email: string };
}

export default function AdminReportsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReports = async (status: string) => {
    setLoading(true);
    try {
      const qs = status ? `?status=${status}` : "";
      const res = await fetch(`/api/admin/reports${qs}`);
      if (!res.ok) throw new Error("Falha ao carregar denúncias");
      const { reports } = await res.json();
      setReports(reports);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchReports(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, authLoading, router, statusFilter]);

  const handleResolve = async (reportId: string) => {
    setBusyId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, { method: "PUT" });
      if (!res.ok) throw new Error("Falha ao resolver");
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyId(null);
    }
  };

  const handleBan = async (report: ReportRow) => {
    const photographerUserId = report.photo.photographer.user.id;
    if (!confirm(`Banir ${report.photo.photographer.user.name}? A conta fica bloqueada de fazer login. Fotos e vendas já feitas continuam intactas.`)) {
      return;
    }
    setBusyId(report.id);
    try {
      const res = await fetch(`/api/admin/users/${photographerUserId}/ban`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao banir");
      }
      setReports((prev) =>
        prev.map((r) =>
          r.photo.photographer.user.id === photographerUserId
            ? { ...r, photo: { ...r.photo, photographer: { ...r.photo.photographer, user: { ...r.photo.photographer.user, banned: true } } } }
            : r
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Denúncias</h1>
        <p className="text-gray-600 mt-2">Fotos denunciadas por utilizadores</p>
      </div>

      <div className="flex gap-2">
        {[
          { value: "open", label: "Abertas" },
          { value: "resolved", label: "Resolvidas" },
          { value: "", label: "Todas" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              statusFilter === opt.value
                ? "bg-[#09419b] text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-gray-600">Nenhuma denúncia encontrada</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report) => {
                const isBusy = busyId === report.id;
                const isBanned = report.photo.photographer.user.banned;
                return (
                  <div key={report.id} className="p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="font-semibold text-gray-900">{report.photo.name}</div>
                        <p className="text-sm text-gray-600 mt-1">
                          Fotógrafo: {report.photo.photographer.user.name}
                          {isBanned && (
                            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                              Banido
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          Denunciado por: {report.reporter.name} ({report.reporter.email})
                        </p>
                        <p className="mt-2 text-sm text-gray-800 bg-[#fef7e8] border-l-2 border-[#f0bf38] px-3 py-2">
                          {report.reason}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(report.createdAt).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-center ${
                            report.status === "resolved"
                              ? "bg-[#e8f0ff] text-blue-800"
                              : "bg-[#fef7e8] text-[#f0bf38]"
                          }`}
                        >
                          {report.status === "resolved" ? "Resolvida" : "Aberta"}
                        </span>
                        {report.status === "open" && (
                          <button
                            onClick={() => handleResolve(report.id)}
                            disabled={isBusy}
                            className="px-3 py-1 bg-[#09419b] text-white text-sm rounded hover:bg-[#09419b]/90 disabled:opacity-50"
                          >
                            Marcar resolvida
                          </button>
                        )}
                        {!isBanned && (
                          <button
                            onClick={() => handleBan(report)}
                            disabled={isBusy}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Banir fotógrafo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
