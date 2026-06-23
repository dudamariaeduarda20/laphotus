"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserRole } from "@/lib/types";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: UserRole.CLIENT,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        await register(
          formData.email,
          formData.password,
          formData.name,
          formData.role as UserRole
        );
        router.push("/profile");
      } else {
        await login(formData.email, formData.password);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha na operação"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {mode === "register" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="João Silva"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Palavra-passe
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••"
        />
      </div>

      {mode === "register" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Conta
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={UserRole.CLIENT}>Cliente (Comprar Fotos)</option>
            <option value={UserRole.PHOTOGRAPHER}>Fotógrafo (Vender)</option>
            <option value={UserRole.ORGANIZER}>Organizador (Eventos)</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Pode alterar isto mais tarde nas configurações
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "A carregar..." : mode === "register" ? "Criar Conta" : "Entrar"}
      </button>

      <div className="text-center text-sm text-gray-600">
        {mode === "register" ? (
          <>
            Já tem conta?{" "}
            <a href="/auth/login" className="text-blue-600 hover:underline">
              Entrar
            </a>
          </>
        ) : (
          <>
            Não tem conta?{" "}
            <a href="/auth/register" className="text-blue-600 hover:underline">
              Criar uma
            </a>
          </>
        )}
      </div>
    </form>
  );
}
