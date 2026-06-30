"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { useTranslation } from "@/lib/hooks/useTranslation";

const roleMessages: Record<string, { key: string; emoji: string; color: string }> = {
  cliente: { key: "cliente", emoji: "👤", color: "from-blue-600 to-blue-700" },
  fotografo: { key: "fotografo", emoji: "📸", color: "from-purple-600 to-purple-700" },
  organizador: { key: "organizador", emoji: "🎯", color: "from-green-600 to-green-700" },
  admin: { key: "admin", emoji: "🔑", color: "from-red-600 to-red-700" },
};

function LoginContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const type = searchParams.get("type") || "cliente";
  const roleInfo = roleMessages[type] || roleMessages.cliente;

  return (
    <div>
      <div className={`bg-gradient-to-r ${roleInfo.color} text-white rounded-lg p-6 mb-8`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{roleInfo.emoji}</span>
          <div>
            <h2 className="text-2xl font-bold">{t(`login.${roleInfo.key}.title`)}</h2>
            <p className="text-white/90">{t(`login.${roleInfo.key}.subtitle`)}</p>
          </div>
        </div>
      </div>
      <AuthForm mode="login" />
    </div>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return <div className="py-20 text-center text-gray-400">{t("common.loading")}</div>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}
