"use client";

import { useTranslation } from "@/lib/hooks/useTranslation";

export default function RegisterHeader() {
  const { t } = useTranslation();
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("auth.createAccount")}</h2>
      <p className="text-gray-600 mb-8">{t("register.subtitle")}</p>
    </>
  );
}
