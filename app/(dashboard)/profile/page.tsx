"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useState } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update endpoint
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("profile.title")}</h1>

      <div className="bg-white rounded-lg shadow p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.role}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.fullName")}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("profile.emailLocked")}
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("dashboard.accountType")}
            </label>
            <input
              type="text"
              value={user?.role}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("profile.roleLocked")}
            </p>
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("profile.memberSince")}
            </label>
            <input
              type="text"
              value={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("pt-PT")
                  : "-"
              }
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t("profile.save")}
            </button>
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              {t("common.cancel")}
            </button>
          </div>

          {saved && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              ✓ {t("profile.saved")}
            </div>
          )}
        </form>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-lg font-bold text-red-600 mb-4">{t("profile.danger")}</h2>
        <button className="px-6 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition">
          {t("profile.deleteAccount")}
        </button>
      </div>
    </div>
  );
}
