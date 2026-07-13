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
    <div className="-mx-4 -my-8">
      {/* Hero Welcome Section — Dark */}
      <section className="bg-[#1a1a1a] text-white py-20 px-6 mb-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif font-bold text-5xl mb-4 leading-tight">
            {t("dashboard.welcome")}, {user?.name}!
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            {t("dashboard.title")} — Gerenciar conta, visualizar estatísticas e acessar ferramentas
          </p>
        </div>
      </section>

      {/* Sales Dashboard (if photographer) */}
      {isPhotographer && (
        <section className="bg-[#f5f1e8] py-16 px-6 mb-12">
          <div className="max-w-7xl mx-auto">
            <PhotographerSalesDashboard />
          </div>
        </section>
      )}

      {/* Main Content — Role-based Cards */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Photographer Section */}
          {isPhotographer && (
            <div className="mb-12">
              <h2 className="font-serif font-bold text-3xl text-[#09419b] mb-8">📸 {t("dashboard.photographer.title")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Link href="/upload" className="group bg-gradient-to-br from-[#09419b] to-[#0a2e6b] text-white rounded-lg p-6 hover:shadow-lg transition">
                  <div className="text-3xl mb-3">⬆️</div>
                  <div className="font-semibold text-sm">{t("dashboard.uploadPhotos")}</div>
                </Link>
                <Link href="/my-photos" className="group bg-white border-2 border-[#09419b] text-[#09419b] rounded-lg p-6 hover:bg-[#f0bf38]/10 transition">
                  <div className="text-3xl mb-3">🖼️</div>
                  <div className="font-semibold text-sm">{t("dashboard.myPhotos")}</div>
                </Link>
                <Link href="/photographer/events" className="group bg-white border-2 border-[#f0bf38] text-[#09419b] rounded-lg p-6 hover:bg-[#f0bf38]/10 transition">
                  <div className="text-3xl mb-3">📅</div>
                  <div className="font-semibold text-sm">{t("photographer.tabs.events")}</div>
                </Link>
                <Link href="/photographer/opportunities" className="group bg-white border-2 border-[#ff2f92] text-[#09419b] rounded-lg p-6 hover:bg-[#ff2f92]/10 transition">
                  <div className="text-3xl mb-3">✨</div>
                  <div className="font-semibold text-sm">{t("photographer.tabs.opportunities")}</div>
                </Link>
                <Link href="/earnings" className="group bg-gradient-to-br from-[#f0bf38] to-[#ff2f92] text-white rounded-lg p-6 hover:shadow-lg transition">
                  <div className="text-3xl mb-3">💰</div>
                  <div className="font-semibold text-sm">{t("dashboard.myEarnings")}</div>
                </Link>
              </div>
            </div>
          )}

          {/* Organizer Section */}
          {isOrganizer && (
            <div className="mb-12">
              <h2 className="font-serif font-bold text-3xl text-[#09419b] mb-8">🎯 {t("dashboard.organizer.title")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/events" className="group bg-gradient-to-br from-[#09419b] to-[#0a2e6b] text-white rounded-lg p-6 hover:shadow-lg transition">
                  <div className="text-3xl mb-3">📋</div>
                  <div className="font-semibold text-sm">{t("dashboard.myEvents")}</div>
                </Link>
                <Link href="/events/new" className="group bg-white border-2 border-[#f0bf38] text-[#09419b] rounded-lg p-6 hover:bg-[#f0bf38]/10 transition">
                  <div className="text-3xl mb-3">➕</div>
                  <div className="font-semibold text-sm">{t("dashboard.createEvent")}</div>
                </Link>
                <Link href="/photos" className="group bg-white border-2 border-[#ff2f92] text-[#09419b] rounded-lg p-6 hover:bg-[#ff2f92]/10 transition">
                  <div className="text-3xl mb-3">🔍</div>
                  <div className="font-semibold text-sm">{t("dashboard.searchEvents")}</div>
                </Link>
              </div>
            </div>
          )}

          {/* Client Section */}
          {isClient && (
            <div className="mb-12">
              <h2 className="font-serif font-bold text-3xl text-[#09419b] mb-8">🛍️ {t("dashboard.client.title")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/photos" className="group bg-gradient-to-br from-[#09419b] to-[#0a2e6b] text-white rounded-lg p-6 hover:shadow-lg transition">
                  <div className="text-3xl mb-3">📸</div>
                  <div className="font-semibold text-sm">{t("dashboard.searchPhotos")}</div>
                </Link>
                <Link href="/downloads" className="group bg-white border-2 border-[#f0bf38] text-[#09419b] rounded-lg p-6 hover:bg-[#f0bf38]/10 transition">
                  <div className="text-3xl mb-3">⬇️</div>
                  <div className="font-semibold text-sm">{t("dashboard.myDownloads")}</div>
                </Link>
                <Link href="/downloads" className="group bg-white border-2 border-[#ff2f92] text-[#09419b] rounded-lg p-6 hover:bg-[#ff2f92]/10 transition">
                  <div className="text-3xl mb-3">📦</div>
                  <div className="font-semibold text-sm">{t("dashboard.myOrders")}</div>
                </Link>
              </div>
            </div>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <div className="mb-12">
              <h2 className="font-serif font-bold text-3xl text-[#09419b] mb-8">🛡️ {t("dashboard.admin.title")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/dashboard" className="group bg-gradient-to-br from-[#09419b] to-[#0a2e6b] text-white rounded-lg p-6 hover:shadow-lg transition">
                  <div className="text-3xl mb-3">📊</div>
                  <div className="font-semibold text-sm">{t("dashboard.admin.panel")}</div>
                </Link>
                <Link href="/admin/photographers" className="group bg-white border-2 border-[#f0bf38] text-[#09419b] rounded-lg p-6 hover:bg-[#f0bf38]/10 transition">
                  <div className="text-3xl mb-3">👥</div>
                  <div className="font-semibold text-sm">{t("dashboard.admin.photographers")}</div>
                </Link>
                <Link href="/admin/settings" className="group bg-white border-2 border-[#ff2f92] text-[#09419b] rounded-lg p-6 hover:bg-[#ff2f92]/10 transition">
                  <div className="text-3xl mb-3">⚙️</div>
                  <div className="font-semibold text-sm">{t("dashboard.admin.settings")}</div>
                </Link>
              </div>
            </div>
          )}

          {/* Account Settings Section */}
          <div className="mb-12">
            <h2 className="font-serif font-bold text-3xl text-[#09419b] mb-8">⚙️ {t("dashboard.settings.title")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/profile" className="group bg-gradient-to-br from-[#f0bf38] to-[#ff2f92] text-white rounded-lg p-6 hover:shadow-lg transition">
                <div className="text-3xl mb-3">👤</div>
                <div className="font-semibold text-sm">{t("dashboard.editProfile")}</div>
              </Link>
              <Link href="/profile" className="group bg-white border-2 border-[#09419b] text-[#09419b] rounded-lg p-6 hover:bg-[#09419b]/5 transition">
                <div className="text-3xl mb-3">🔐</div>
                <div className="font-semibold text-sm">{t("dashboard.account")}</div>
              </Link>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-[#1a1a1a] text-white p-8 rounded-lg border-l-4 border-[#f0bf38]">
            <div className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">{t("dashboard.accountType")}</div>
            <div className="text-3xl font-serif font-bold text-[#f0bf38]">{user?.role}</div>
          </div>
        </div>
      </section>

      {/* Photographer Tabs (if exists) */}
      {isPhotographer && (
        <section className="bg-[#f5f1e8] py-16 px-6 border-t-2 border-[#f0bf38]">
          <div className="max-w-7xl mx-auto">
            <PhotographerTabs />
          </div>
        </section>
      )}
    </div>
  );
}
