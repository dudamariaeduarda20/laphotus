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
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            L
          </div>
          <span className="font-bold text-lg hidden sm:inline text-gray-900 dark:text-white">LAPHOTUS</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-5">
          <Link
            href="/photos"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
          >
            {t("nav.events")}
          </Link>

          {!isAuthenticated && (
            <>
              <Link
                href="/auth/register"
                className="hidden md:inline text-gray-600 hover:text-gray-900 transition"
              >
                {t("nav.photographer")}
              </Link>
              <Link
                href="/auth/register"
                className="hidden md:inline text-gray-600 hover:text-gray-900 transition"
              >
                {t("nav.organizer")}
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <>
              <Link
                href={user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                {t("nav.dashboard")}
              </Link>

              <Cart />
              <NotificationBell />
              <ThemeToggle />
              <LanguageSelector />

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
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
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
