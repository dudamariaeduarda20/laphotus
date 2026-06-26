"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cart from "./Cart";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            L
          </div>
          <span className="font-bold text-lg hidden sm:inline">LAPHOTUS</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-5">
          <Link
            href="/photos"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            Eventos
          </Link>

          {!isAuthenticated && (
            <>
              <Link
                href="/auth/register"
                className="hidden md:inline text-gray-600 hover:text-gray-900 transition"
              >
                Sou fotógrafo
              </Link>
              <Link
                href="/auth/register"
                className="hidden md:inline text-gray-600 hover:text-gray-900 transition"
              >
                Sou organizador
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Painel
              </Link>

              {/* Cart */}
              <Cart />

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {user?.name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    Perfil
                  </Link>

                  {user?.role === "PHOTOGRAPHER" && (
                    <Link
                      href="/upload"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Carregar Fotos
                    </Link>
                  )}

                  {user?.role === "ORGANIZER" && (
                    <Link
                      href="/events"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Meus Eventos
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg border-t"
                  >
                    Terminar Sessão
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Registar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
