"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

interface Props {
  recipientId: string;
  photoId?: string;
  eventId?: string;
  className?: string;
  variant?: "icon" | "button";
}

export default function StartConversationButton({
  recipientId,
  photoId,
  eventId,
  className = "",
  variant = "button",
}: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: recipientId, photoId, eventId }),
      });

      if (res.ok) {
        const conversation = await res.json();
        router.push(`/messages/${conversation.id}`);
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`text-2xl hover:scale-110 transition disabled:opacity-50 ${className}`}
        title="Mensagem"
      >
        💬
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-3 rounded-lg font-semibold border transition mb-4 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 ${className}`}
    >
      {loading ? "..." : "💬 Enviar mensagem"}
    </button>
  );
}
