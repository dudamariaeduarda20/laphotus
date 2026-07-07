"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#f5f5f5] border-t border-[#ddd] mt-20">
      <div className="container-editorial py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="font-sans font-bold text-[#333] mb-3">{t("footer.institutional")}</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="text-[#666] hover:text-[#09419b] transition">{t("footer.about")}</Link></li>
            <li><Link href="/" className="text-[#666] hover:text-[#09419b] transition">{t("footer.blog")}</Link></li>
            <li><Link href="/" className="text-[#666] hover:text-[#09419b] transition">{t("footer.packages")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans font-bold text-[#333] mb-3">{t("footer.sell")}</h4>
          <ul className="space-y-2">
            <li><Link href="/auth/register" className="text-[#666] hover:text-[#09419b] transition">{t("footer.photographer")}</Link></li>
            <li><Link href="/auth/register" className="text-[#666] hover:text-[#09419b] transition">{t("footer.organizer")}</Link></li>
            <li><Link href="/auth/register" className="text-[#666] hover:text-[#09419b] transition">{t("footer.schools")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans font-bold text-[#333] mb-3">{t("footer.account")}</h4>
          <ul className="space-y-2">
            <li><Link href="/profile" className="text-[#666] hover:text-[#09419b] transition">{t("footer.myAccount")}</Link></li>
            <li><Link href="/downloads" className="text-[#666] hover:text-[#09419b] transition">{t("footer.myOrders")}</Link></li>
            <li><Link href="/auth/login" className="text-[#666] hover:text-[#09419b] transition">{t("footer.login")}</Link></li>
            <li><Link href="/auth/register" className="text-[#666] hover:text-[#09419b] transition">{t("footer.register")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans font-bold text-[#333] mb-3">{t("footer.help")}</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="text-[#666] hover:text-[#09419b] transition">{t("footer.howToBuy")}</Link></li>
            <li><Link href="/" className="text-[#666] hover:text-[#09419b] transition">{t("footer.contact")}</Link></li>
            <li><Link href="/" className="text-[#666] hover:text-[#09419b] transition">{t("footer.support")}</Link></li>
            <li><Link href="/" className="text-[#666] hover:text-[#09419b] transition">{t("footer.removePhotos")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#ddd]">
        <div className="container-editorial py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#999]">
          <img src="/logo-icon.svg" alt="LAPHOTUS" className="h-6" />
          <span>© {year} LAPHOTUS · {t("footer.tagline")}</span>
          <span className="hover:text-[#09419b] cursor-pointer transition">{t("footer.privacy")}</span>
        </div>
      </div>
    </footer>
  );
}
