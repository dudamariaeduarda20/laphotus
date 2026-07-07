"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cart from "./Cart";
import NotificationBell from "./NotificationBell";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#dddddd] shadow-sm">
      <div className="container-editorial py-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/logo-text.svg" alt="LAPHOTUS" className="h-8" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link href="/photos" className="text-sm font-sans text-[#333] hover:text-[#09419b] transition">
            {t("nav.events")}
          </Link>

          {!isAuthenticated && (
            <>
              <Link href="/fotografo" className="hidden md:inline text-sm font-sans text-[#333] hover:text-[#09419b] transition">
                {t("nav.photographer")}
              </Link>
              <Link href="/organizador" className="hidden md:inline text-sm font-sans text-[#333] hover:text-[#09419b] transition">
                {t("nav.organizer")}
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <>
              <Link href={user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"} className="text-sm font-sans text-[#333] hover:text-[#09419b] transition">
                {t("nav.dashboard")}
              </Link>
              <Cart />
              <NotificationBell />
              <ThemeToggle />
              <LanguageSelector />
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-[#f5f5f5]">
                  <div className="w-8 h-8 bg-[#f0bf38]/20 rounded-full flex items-center justify-center text-sm font-bold text-[#09419b]">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline text-[#333]">{user?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#ddd] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                    {t("nav.profile")}
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                    {t("settings.title")}
                  </Link>
                  {user?.role === "PHOTOGRAPHER" && (
                    <Link href="/upload" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                      {t("nav.uploadPhotos")}
                    </Link>
                  )}
                  {user?.role === "ORGANIZER" && (
                    <>
                      <Link href="/events" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                        {t("nav.myEvents")}
                      </Link>
                      <Link href="/analytics" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                        {t("nav.analytics")}
                      </Link>
                    </>
                  )}
                  {user?.role === "ADMIN" && (
                    <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                      {t("nav.adminPanel")}
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5]">
                    {t("nav.logout")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
              <LanguageSelector />
              <Link href="/auth/login" className="text-sm font-sans text-[#333] hover:text-[#09419b] transition">
                {t("nav.login")}
              </Link>
              <button className="btn-primary text-xs">{t("nav.register")}</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
