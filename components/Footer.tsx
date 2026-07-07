"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden text-gray-300 mt-20 bg-gradient-to-r from-gray-900 via-[#09419b]/20 to-gray-900 dark:from-gray-950 dark:via-[#09419b]/10 dark:to-gray-950">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="font-bold text-white mb-3">{t("footer.institutional")}</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:text-white">{t("footer.about")}</Link></li>
            <li><Link href="/" className="hover:text-white">{t("footer.blog")}</Link></li>
            <li><Link href="/" className="hover:text-white">{t("footer.packages")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">{t("footer.sell")}</h4>
          <ul className="space-y-2">
            <li><Link href="/auth/register" className="hover:text-white">{t("footer.photographer")}</Link></li>
            <li><Link href="/auth/register" className="hover:text-white">{t("footer.organizer")}</Link></li>
            <li><Link href="/auth/register" className="hover:text-white">{t("footer.schools")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">{t("footer.account")}</h4>
          <ul className="space-y-2">
            <li><Link href="/profile" className="hover:text-white">{t("footer.myAccount")}</Link></li>
            <li><Link href="/downloads" className="hover:text-white">{t("footer.myOrders")}</Link></li>
            <li><Link href="/auth/login" className="hover:text-white">{t("footer.login")}</Link></li>
            <li><Link href="/auth/register" className="hover:text-white">{t("footer.register")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">{t("footer.help")}</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:text-white">{t("footer.howToBuy")}</Link></li>
            <li><Link href="/" className="hover:text-white">{t("footer.contact")}</Link></li>
            <li><Link href="/" className="hover:text-white">{t("footer.support")}</Link></li>
            <li><Link href="/" className="hover:text-white">{t("footer.removePhotos")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <img src="/logo-icon-white.svg" alt="LAPHOTUS" className="h-6 opacity-80 hover:opacity-100 transition-smooth" />
          <span className="font-light">© {year} LAPHOTUS · {t("footer.tagline")}</span>
          <span className="hover:text-gray-200 transition-smooth cursor-pointer">{t("footer.privacy")}</span>
        </div>
      </div>
    </footer>
  );
}
