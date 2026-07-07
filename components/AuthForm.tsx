"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { UserRole } from "@/lib/types";

interface AuthFormProps {
  mode: "login" | "register";
}

const ROLE_BY_TYPE: Record<string, UserRole> = {
  fotografo: UserRole.PHOTOGRAPHER,
  organizador: UserRole.ORGANIZER,
  cliente: UserRole.CLIENT,
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  const { t } = useTranslation();

  const initialRole =
    mode === "register"
      ? ROLE_BY_TYPE[searchParams.get("type") || ""] || UserRole.CLIENT
      : UserRole.CLIENT;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: initialRole,
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
        err instanceof Error ? err.message : t("auth.err.fail")
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
            {t("auth.fullName")}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t("auth.namePlaceholder")}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("auth.email")}
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
          {t("auth.password")}
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
            {t("dashboard.accountType")}
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={UserRole.CLIENT}>{t("auth.role.client")}</option>
            <option value={UserRole.PHOTOGRAPHER}>{t("auth.role.photographer")}</option>
            <option value={UserRole.ORGANIZER}>{t("auth.role.organizer")}</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            {t("auth.roleHint")}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#09419b] text-white font-medium rounded-lg hover:bg-[#09419b] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? t("common.loading") : mode === "register" ? t("auth.createAccount") : t("auth.submit.login")}
      </button>

      <div className="text-center text-sm text-gray-600">
        {mode === "register" ? (
          <>
            {t("auth.haveAccount")}{" "}
            <a href="/auth/login" className="text-[#09419b] hover:underline">
              {t("auth.submit.login")}
            </a>
          </>
        ) : (
          <>
            {t("auth.noAccount")}{" "}
            <a href="/auth/register" className="text-[#09419b] hover:underline">
              {t("auth.createOne")}
            </a>
          </>
        )}
      </div>
    </form>
  );
}
