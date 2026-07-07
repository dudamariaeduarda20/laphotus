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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#09419b]/90 via-[#8B5CF6]/70 to-[#06B6D4]/70 dark:from-[#09419b]/80 dark:via-[#8B5CF6]/60 dark:to-[#06B6D4]/60 border-b border-white/10 dark:border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo-icon-white.svg" alt="LAPHOTUS" className="w-8 h-8" />
          <span className="font-bold text-lg hidden sm:inline text-white font-montserrat">LAPHOTUS</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-5">
          <Link
            href="/photos"
            className="text-white hover:text-[#e8f0ff] transition"
          >
            {t("nav.events")}
          </Link>

          {!isAuthenticated && (
            <>
              <Link
                href="/fotografo"
                className="hidden md:inline text-white hover:text-[#e8f0ff] transition"
              >
                {t("nav.photographer")}
              </Link>
              <Link
                href="/organizador"
                className="hidden md:inline text-white hover:text-[#e8f0ff] transition"
              >
                {t("nav.organizer")}
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <>
              <Link
                href={user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"}
                className="text-white hover:text-[#e8f0ff] transition"
              >
                {t("nav.dashboard")}
              </Link>

              <Cart />
              <NotificationBell />
              <ThemeToggle />
              <LanguageSelector />

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#072e70]">
                  <div className="w-8 h-8 bg-[#e8f0ff] rounded-full flex items-center justify-center text-sm font-bold text-[#09419b]">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline text-white">
                    {user?.name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
                  >
                    {t("nav.profile")}
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t("settings.title")}
                  </Link>

                  {user?.role === "PHOTOGRAPHER" && (
                    <Link
                      href="/upload"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t("nav.uploadPhotos")}
                    </Link>
                  )}

                  {user?.role === "ORGANIZER" && (
                    <>
                      <Link
                        href="/events"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t("nav.myEvents")}
                      </Link>
                      <Link
                        href="/analytics"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t("nav.analytics")}
                      </Link>
                    </>
                  )}

                  {user?.role === "ADMIN" && (
                    <Link
                      href="/admin/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t("nav.adminPanel")}
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg border-t dark:border-gray-700"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
              <LanguageSelector />
              <Link
                href="/auth/login"
                className="text-white hover:text-[#e8f0ff] transition"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] transition"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
