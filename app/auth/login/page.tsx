"use client";

import { useSearchParams } from "next/navigation";
import AuthForm from "@/components/AuthForm";

const roleMessages: Record<string, { title: string; subtitle: string; emoji: string; color: string }> = {
  cliente: {
    title: "Bem-vindo, Cliente",
    subtitle: "Inicie sessão para comprar fotos de desporto",
    emoji: "👤",
    color: "from-blue-600 to-blue-700",
  },
  fotografo: {
    title: "Bem-vindo, Fotógrafo",
    subtitle: "Inicie sessão para carregar e vender as suas fotos",
    emoji: "📸",
    color: "from-purple-600 to-purple-700",
  },
  organizador: {
    title: "Bem-vindo, Organizador",
    subtitle: "Inicie sessão para gerir os seus eventos",
    emoji: "🎯",
    color: "from-green-600 to-green-700",
  },
  admin: {
    title: "Bem-vindo, Administrador",
    subtitle: "Inicie sessão para gerir a plataforma",
    emoji: "🔑",
    color: "from-red-600 to-red-700",
  },
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "cliente";
  const roleInfo = roleMessages[type] || roleMessages.cliente;

  return (
    <div>
      <div className={`bg-gradient-to-r ${roleInfo.color} text-white rounded-lg p-6 mb-8`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{roleInfo.emoji}</span>
          <div>
            <h2 className="text-2xl font-bold">{roleInfo.title}</h2>
            <p className="text-white/90">{roleInfo.subtitle}</p>
          </div>
        </div>
      </div>
      <AuthForm mode="login" />
    </div>
  );
}
