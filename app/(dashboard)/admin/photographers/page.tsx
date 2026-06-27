"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function AdminPhotographers() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }

    fetchPhotographers();
  }, [isAdmin, authLoading, router]);

  const fetchPhotographers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/photographers");
      if (!res.ok) throw new Error("Falha ao carregar");

      const { photographers } = await res.json();
      setPhotographers(photographers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId: string) => {
    setActionInProgress(userId);
    try {
      const res = await fetch(`/api/admin/photographers/${userId}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao ativar");
      setPhotographers(
        photographers.map((p) =>
          p.user.id === userId ? { ...p, active: true } : p
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleBlock = async (userId: string) => {
    setActionInProgress(userId);
    try {
      const res = await fetch(`/api/admin/photographers/${userId}/block`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao bloquear");
      setPhotographers(
        photographers.map((p) =>
          p.user.id === userId ? { ...p, active: false } : p
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setActionInProgress(null);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestão de Fotógrafos
        </h1>
        <p className="text-gray-600 mt-2">
          Aprovar, bloquear e gerenciar fotógrafos da plataforma
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {photographers.length} Fotógrafos
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Fotos
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {photographers.map((photo) => (
                <tr key={photo.user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {photo.user.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {photo.user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {photo.photoCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-semibold text-gray-900">
                        {photo.rating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {photo.active ? (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                        Bloqueado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {!photo.active && (
                      <button
                        onClick={() => handleActivate(photo.user.id)}
                        disabled={actionInProgress === photo.user.id}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        ✓ Ativar
                      </button>
                    )}
                    {photo.active && (
                      <button
                        onClick={() => handleBlock(photo.user.id)}
                        disabled={actionInProgress === photo.user.id}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        ✕ Bloquear
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {photographers.length === 0 && (
          <div className="p-12 text-center text-gray-600">
            Nenhum fotógrafo registado
          </div>
        )}
      </div>
    </div>
  );
}
