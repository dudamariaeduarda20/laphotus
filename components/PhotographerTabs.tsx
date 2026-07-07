"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/hooks/useTranslation";

const TABS = [
  { href: "/dashboard", key: "photographer.tabs.dashboard" },
  { href: "/photographer/events", key: "photographer.tabs.events" },
  { href: "/photographer/opportunities", key: "photographer.tabs.opportunities" },
  { href: "/upload", key: "photographer.tabs.upload" },
  { href: "/earnings", key: "photographer.tabs.earnings" },
];

export default function PhotographerTabs() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-3">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              active
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </div>
  );
}
