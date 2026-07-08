"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cart from "./Cart";
import NotificationBell from "./NotificationBell";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLink = isHome
    ? "text-base font-sans text-white hover:text-[#f0bf38] transition"
    : "text-base font-sans text-[#333] hover:text-[#ff2f92] transition";

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    router.push("/");
  };

  const dashboardHref = user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";

  return (
    <header
      className={
        isHome
          ? "sticky top-0 z-50 bg-[#09419b]"
          : "sticky top-0 z-50 bg-white border-b border-[#dddddd] shadow-sm"
      }
    >
      <div className="container-editorial py-4 px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
          <img
            src={isHome ? "/logo-text-white.svg" : "/logo-text.svg"}
            alt="LAPHOTUS"
            className="h-10"
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/photos" className={navLink}>
            {t("nav.events")}
          </Link>

          {!isAuthenticated && (
            <>
              <Link href="/fotografo" className={navLink}>
                {t("nav.photographer")}
              </Link>
              <Link href="/organizador" className={navLink}>
                {t("nav.organizer")}
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <>
              <Link href={dashboardHref} className={navLink}>
                {t("nav.dashboard")}
              </Link>
              <Cart />
              <NotificationBell />
              <ThemeToggle isHome={isHome} />
              <LanguageSelector isHome={isHome} />
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded hover:bg-[#f5f5f5]"
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-[#f0bf38]/20 rounded-full flex items-center justify-center text-sm font-bold text-[#09419b]">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline text-[#333]">{user?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#ddd] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition">
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
              <ThemeToggle isHome={isHome} />
              <LanguageSelector isHome={isHome} />
              <Link href="/auth/login" className={navLink}>
                {t("nav.login")}
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm">
                {t("nav.register")}
              </Link>
            </>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && <Cart />}
          <ThemeToggle isHome={isHome} />
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            className={isHome ? "p-2 text-white" : "p-2 text-[#333]"}
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#ddd] shadow-lg">
          <nav className="flex flex-col px-6 py-4 gap-1">
            <Link href="/photos" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
              {t("nav.events")}
            </Link>

            {!isAuthenticated ? (
              <>
                <Link href="/fotografo" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                  {t("nav.photographer")}
                </Link>
                <Link href="/organizador" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                  {t("nav.organizer")}
                </Link>
                <Link href="/auth/login" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                  {t("nav.login")}
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm text-center mt-3" onClick={() => setMobileOpen(false)}>
                  {t("nav.register")}
                </Link>
                <div className="pt-4">
                  <LanguageSelector />
                </div>
              </>
            ) : (
              <>
                <Link href={dashboardHref} className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                  {t("nav.dashboard")}
                </Link>
                <Link href="/profile" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                  {t("nav.profile")}
                </Link>
                <Link href="/settings" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                  {t("settings.title")}
                </Link>
                {user?.role === "PHOTOGRAPHER" && (
                  <Link href="/upload" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                    {t("nav.uploadPhotos")}
                  </Link>
                )}
                {user?.role === "ORGANIZER" && (
                  <>
                    <Link href="/events" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                      {t("nav.myEvents")}
                    </Link>
                    <Link href="/analytics" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                      {t("nav.analytics")}
                    </Link>
                  </>
                )}
                {user?.role === "ADMIN" && (
                  <Link href="/admin/dashboard" className="py-3 text-base text-[#333] hover:text-[#ff2f92] border-b border-[#eee]" onClick={() => setMobileOpen(false)}>
                    {t("nav.adminPanel")}
                  </Link>
                )}
                <div className="flex items-center justify-between py-3">
                  <LanguageSelector />
                  <NotificationBell />
                </div>
                <button onClick={handleLogout} className="py-3 text-left text-base text-[#ff2f92] font-medium">
                  {t("nav.logout")}
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
