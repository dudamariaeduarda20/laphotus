"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import Link from "next/link";
import PhotographerSalesDashboard from "@/components/PhotographerSalesDashboard";
import PhotographerTabs from "@/components/PhotographerTabs";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isPhotographer, isOrganizer, isClient, isAdmin } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (isClient && !isPhotographer && !isOrganizer && !isAdmin) {
      router.push("/");
    }
  }, [isClient, isPhotographer, isOrganizer, isAdmin, router]);

  return (
    <div>
      {isPhotographer && <PhotographerTabs />}

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t("dashboard.title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{t("dashboard.welcome")}, {user?.name}!</p>

      {isPhotographer && <PhotographerSalesDashboard />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isPhotographer && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              📸 {t("dashboard.photographer.title")}
            </h2>
            <div className="space-y-3">
              <Link href="/upload" className="block px-4 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] text-center transition">
                {t("dashboard.uploadPhotos")}
              </Link>
              <Link href="/my-photos" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                {t("dashboard.myPhotos")}
              </Link>
              <Link href="/photographer/events" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                {t("photographer.tabs.events")}
              </Link>
              <Link href="/photographer/opportunities" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                {t("photographer.tabs.opportunities")}
              </Link>
              <Link href="/earnings" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                💰 {t("dashboard.myEarnings")}
              </Link>
            </div>
          </div>
        )}

        {isOrganizer && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              🎯 {t("dashboard.organizer.title")}
            </h2>
            <div className="space-y-3">
              <Link href="/events" className="block px-4 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] text-center transition">
                {t("dashboard.myEvents")}
              </Link>
              <Link href="/events/new" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                {t("dashboard.createEvent")}
              </Link>
              <Link href="/photos" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                {t("dashboard.searchEvents")}
              </Link>
            </div>
          </div>
        )}

        {isClient && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              🛍️ {t("dashboard.client.title")}
            </h2>
            <div className="space-y-3">
              <Link href="/photos" className="block px-4 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] text-center transition">
                {t("dashboard.searchPhotos")}
              </Link>
              <Link href="/downloads" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                ⬇ {t("dashboard.myDownloads")}
              </Link>
              <Link href="/downloads" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                {t("dashboard.myOrders")}
              </Link>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              🛡️ {t("dashboard.admin.title")}
            </h2>
            <div className="space-y-3">
              <Link href="/admin/dashboard" className="block px-4 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] text-center transition">
                {t("dashboard.admin.panel")}
              </Link>
              <Link href="/admin/photographers" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                {t("dashboard.admin.photographers")}
              </Link>
              <Link href="/admin/settings" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
                {t("dashboard.admin.settings")}
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ {t("dashboard.settings.title")}</h2>
          <div className="space-y-3">
            <Link href="/profile" className="block px-4 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] text-center transition">
              {t("dashboard.editProfile")}
            </Link>
            <Link href="/profile" className="block px-4 py-2 border border-[#09419b] text-[#09419b] rounded-lg hover:bg-[#e8f0ff] text-center transition">
              {t("dashboard.account")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-[#e8f0ff] dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("dashboard.accountType")}:{" "}
          <span className="font-bold text-[#09419b] text-lg">{user?.role}</span>
        </p>
      </div>
    </div>
  );
}
