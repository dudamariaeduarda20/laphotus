"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-md">
        <p className="font-serif font-bold text-7xl text-[#09419b] leading-none">404</p>
        <h1 className="font-serif text-2xl text-[#333] mt-4">
          {t("notFound.title", "Página não encontrada")}
        </h1>
        <p className="text-[#666] mt-3">
          {t("notFound.desc", "A página que procura não existe ou foi movida.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href="/" className="btn-primary">
            {t("notFound.home", "Voltar ao início")}
          </Link>
          <Link
            href="/photos"
            className="px-6 py-2 border border-[#09419b] text-[#09419b] rounded-md font-medium hover:bg-[#09419b] hover:text-white transition"
          >
            {t("notFound.events", "Ver eventos")}
          </Link>
        </div>
      </div>
    </div>
  );
}
