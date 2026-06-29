"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import Link from "next/link";
import PhotographerSalesDashboard from "@/components/PhotographerSalesDashboard";

export default function DashboardPage() {
  const { user, isPhotographer, isOrganizer, isClient } = useAuth();
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("dashboard.title")}</h1>
      <p className="text-gray-600 mb-8">{t("dashboard.welcome")}, {user?.name}!</p>

      {isPhotographer && <PhotographerSalesDashboard />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isPhotographer && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              📸 {t("dashboard.photographer.title")}
            </h2>
            <div className="space-y-3">
              <Link href="/upload" className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition">
                {t("dashboard.uploadPhotos")}
              </Link>
              <Link href="/my-photos" className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition">
                {t("dashboard.myPhotos")}
              </Link>
              <Link href="/earnings" className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition">
                💰 {t("dashboard.myEarnings")}
              </Link>
            </div>
          </div>
        )}

        {isOrganizer && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              🎯 {t("dashboard.organizer.title")}
            </h2>
            <div className="space-y-3">
              <Link href="/events" className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition">
                {t("dashboard.myEvents")}
              </Link>
              <Link href="/events/new" className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition">
                {t("dashboard.createEvent")}
              </Link>
              <Link href="/photos" className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition">
                {t("dashboard.searchEvents")}
              </Link>
            </div>
          </div>
        )}

        {isClient && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              🛍️ {t("dashboard.client.title")}
            </h2>
            <div className="space-y-3">
              <Link href="/photos" className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition">
                {t("dashboard.searchPhotos")}
              </Link>
              <Link href="/downloads" className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition">
                ⬇ {t("dashboard.myDownloads")}
              </Link>
              <Link href="/downloads" className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition">
                {t("dashboard.myOrders")}
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ {t("dashboard.settings.title")}</h2>
          <div className="space-y-3">
            <Link href="/profile" className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition">
              {t("dashboard.editProfile")}
            </Link>
            <Link href="/profile" className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center transition">
              {t("dashboard.account")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600">
          {t("dashboard.accountType")}:{" "}
          <span className="font-bold text-blue-600 text-lg">{user?.role}</span>
        </p>
      </div>
    </div>
  );
}
