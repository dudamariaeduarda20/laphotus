"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import CartIcon from "./CartIcon";
import NotificationBell from "./NotificationBell";
import LanguageSelector from "./LanguageSelector";

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
      {/* Header container: height 90px, generous padding, centered vertically */}
      <div className="h-[90px] px-12 flex items-center justify-between">
        {/* Logo section — left */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0" onClick={() => setMobileOpen(false)}>
          <img
            src={isHome ? "/logo-text-white.svg" : "/logo-text.svg"}
            alt="LAPHOTUS"
            className="h-10"
          />
        </Link>

        {/* Desktop navigation — center + right */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-12 ml-auto">
          {/* Nav items */}
          <Link href="/photos" className={navLink}>
            {t("nav.events", "Eventos")}
          </Link>

          {!isAuthenticated && (
            <>
              <Link href="/fotografo" className={navLink}>
                {t("nav.photographer", "Sou fotógrafo")}
              </Link>
              <Link href="/organizador" className={navLink}>
                {t("nav.organizer", "Sou organizador")}
              </Link>
            </>
          )}

          {/* Language selector */}
          <div className={navLink + " !hover:text-inherit cursor-pointer"}>
            <LanguageSelector isHome={isHome} />
          </div>

          {/* Auth section */}
          {isAuthenticated ? (
            <>
              <Link href={dashboardHref} className={navLink}>
                {t("nav.dashboard", "Painel")}
              </Link>
              <CartIcon />
              <NotificationBell />
              <div className="relative group">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded ${
                    isHome ? "hover:bg-white/10" : "hover:bg-[#f5f5f5]"
                  }`}
                  aria-haspopup="true"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isHome ? "bg-white/20 text-white" : "bg-[#f0bf38]/20 text-[#09419b]"
                    }`}
                  >
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${isHome ? "text-white" : "text-[#333]"}`}>
                    {user?.name}
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#ddd] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                    {t("nav.profile", "Perfil")}
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                    {t("settings.title", "Configurações")}
                  </Link>
                  {user?.role === "PHOTOGRAPHER" && (
                    <Link href="/upload" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                      {t("nav.uploadPhotos", "Upload de Fotos")}
                    </Link>
                  )}
                  {user?.role === "ORGANIZER" && (
                    <>
                      <Link href="/events" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                        {t("nav.myEvents", "Meus Eventos")}
                      </Link>
                      <Link href="/analytics" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                        {t("nav.analytics", "Analytics")}
                      </Link>
                    </>
                  )}
                  {user?.role === "ADMIN" && (
                    <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5] border-b">
                      {t("nav.adminPanel", "Painel Admin")}
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f5]">
                    {t("nav.logout", "Sair")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={navLink}>
                {t("nav.login", "Entrar")}
              </Link>
              <Link
                href="/auth/register"
                className="px-8 py-3 bg-[#ff2f92] text-white rounded-full font-semibold text-sm hover:opacity-90 transition whitespace-nowrap"
              >
                {t("nav.register", "Cadastro")}
              </Link>
            </>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-2">
          {isAuthenticated && <CartIcon />}
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
        <div className={isHome ? "bg-[#0d2d6f]" : "bg-white border-t border-[#ddd] shadow-lg"}>
          <nav className="flex flex-col px-6 py-4 gap-1">
            <Link
              href="/photos"
              className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.events", "Eventos")}
            </Link>

            {!isAuthenticated ? (
              <>
                <Link
                  href="/fotografo"
                  className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.photographer", "Sou fotógrafo")}
                </Link>
                <Link
                  href="/organizador"
                  className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.organizer", "Sou organizador")}
                </Link>
                <Link
                  href="/auth/login"
                  className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.login", "Entrar")}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-8 py-3 bg-[#ff2f92] text-white rounded-full font-semibold text-sm text-center mt-3"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.register", "Cadastro")}
                </Link>
                <div className="pt-4">
                  <LanguageSelector />
                </div>
              </>
            ) : (
              <>
                <Link
                  href={dashboardHref}
                  className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.dashboard", "Painel")}
                </Link>
                <Link
                  href="/profile"
                  className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.profile", "Perfil")}
                </Link>
                <Link
                  href="/settings"
                  className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("settings.title", "Configurações")}
                </Link>
                {user?.role === "PHOTOGRAPHER" && (
                  <Link
                    href="/upload"
                    className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.uploadPhotos", "Upload")}
                  </Link>
                )}
                {user?.role === "ORGANIZER" && (
                  <>
                    <Link
                      href="/events"
                      className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("nav.myEvents", "Eventos")}
                    </Link>
                    <Link
                      href="/analytics"
                      className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("nav.analytics", "Analytics")}
                    </Link>
                  </>
                )}
                {user?.role === "ADMIN" && (
                  <Link
                    href="/admin/dashboard"
                    className={`py-3 text-base border-b ${isHome ? "text-white hover:text-[#f0bf38]" : "text-[#333] hover:text-[#ff2f92]"} border-[#eee]`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.adminPanel", "Admin")}
                  </Link>
                )}
                <div className="flex items-center justify-between py-3">
                  <LanguageSelector />
                  <NotificationBell />
                </div>
                <button onClick={handleLogout} className={`py-3 text-left text-base font-medium ${isHome ? "text-[#f0bf38]" : "text-[#ff2f92]"}`}>
                  {t("nav.logout", "Sair")}
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
