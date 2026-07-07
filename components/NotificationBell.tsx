"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  ORDER_CONFIRMED: "✅",
  PHOTO_AVAILABLE: "📸",
  NEW_PHOTO_MATCH: "🔍",
  PHOTO_PURCHASED: "💰",
  PAYMENT_RECEIVED: "💶",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications");
      if (!r.ok) return;
      const d = await r.json();
      setNotifications(d.notifications || []);
      setUnreadCount(d.unreadCount || 0);
    } catch {
      // silent — bell is non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      setLoading(true);
      try {
        await fetch("/api/notifications/read", { method: "PATCH" });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
        aria-label="Notificações"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-600"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">
              Notificações
            </span>
            {loading && (
              <div className="w-4 h-4 border-2 border-[#09419b] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                Sem notificações
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 hover:bg-gray-50 ${
                    !n.read ? "bg-[#e8f0ff]/50" : ""
                  }`}
                >
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] || "🔔"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-900 leading-tight">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400">
                +{notifications.length - 10} mais notificações
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
