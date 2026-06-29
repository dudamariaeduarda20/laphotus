"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
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
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span className="font-bold text-white">LAPHOTUS</span>
          <span>© {year} LAPHOTUS · {t("footer.tagline")}</span>
          <span>{t("footer.privacy")}</span>
        </div>
      </div>
    </footer>
  );
}
