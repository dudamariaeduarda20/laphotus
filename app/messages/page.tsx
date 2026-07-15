"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  initiatorId: string;
  participantId: string;
  photoId?: string;
  eventId?: string;
  initiator: { id: string; name: string; avatar?: string };
  participant: { id: string; name: string; avatar?: string };
  photo?: { id: string; name: string };
  event?: { id: string; title: string };
  messages: Array<{ id: string; senderId: string; read: boolean }>;
  lastMessageAt?: string;
}

export default function MessagesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    fetchConversations();
  }, [isAuthenticated, authLoading, router]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-10">A carregar...</div>;
  }

  const getOtherUser = (conv: Conversation) =>
    conv.initiatorId === user?.id ? conv.participant : conv.initiator;

  const getContext = (conv: Conversation) =>
    conv.photo?.name || conv.event?.title || "Conversa direta";

  const getUnreadCount = (conv: Conversation) =>
    conv.messages?.filter(
      (m) =>
        !m.read &&
        m.senderId !== user?.id
    ).length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensagens</h1>
      <p className="text-gray-600 mb-8">
        Conversar com fotógrafos e organizadores sobre fotos e eventos.
      </p>

      {conversations.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <div className="text-5xl mb-4">💬</div>
          <p className="text-lg font-semibold text-gray-700 mb-1">
            Sem conversas ainda
          </p>
          <p className="text-gray-500 mb-6">
            Inicie uma conversa ao ver uma foto ou evento.
          </p>
          <Link
            href="/photos"
            className="inline-block px-6 py-3 bg-[#09419b] text-white rounded-full font-semibold hover:bg-[#09419b]/90 transition"
          >
            Explorar fotos
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const other = getOtherUser(conv);
            const unread = getUnreadCount(conv);
            return (
              <Link key={conv.id} href={`/messages/${conv.id}`}>
                <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#09419b] hover:shadow-md transition cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-[#f0bf38]/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#09419b]">
                    {other.name[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{other.name}</p>
                      {unread > 0 && (
                        <span className="inline-block px-2 py-1 bg-[#ff2f92] text-white text-xs font-bold rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {getContext(conv)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {conv.lastMessageAt
                        ? new Date(conv.lastMessageAt).toLocaleDateString("pt")
                        : "Agora"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
