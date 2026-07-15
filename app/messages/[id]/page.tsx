"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages";

interface Message {
  id: string;
  content: string;
  senderId: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatar?: string };
}

interface Conversation {
  id: string;
  initiatorId: string;
  participantId: string;
  initiator: { id: string; name: string };
  participant: { id: string; name: string };
  photo?: { id: string; name: string };
  event?: { id: string; title: string };
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, authLoading, router]);

  useRealtimeMessages(params.id, (newMsg) => {
    setMessages((prev) => [...prev, newMsg]);
    scrollToBottom();
  });

  const fetchData = async () => {
    try {
      const [convRes, msgsRes] = await Promise.all([
        fetch(`/api/conversations/${params.id}`, { credentials: "include" }),
        fetch(`/api/conversations/${params.id}/messages`, {
          credentials: "include",
        }),
      ]);

      if (!convRes.ok || !msgsRes.ok) {
        router.push("/messages");
        return;
      }

      const convData = await convRes.json();
      const msgsData = await msgsRes.json();

      if (convData.id) {
        setConversation(convData);
        setMessages(msgsData.messages || []);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${params.id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setInput("");
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleReportMessage = async (messageId: string) => {
    const reason = prompt("Motivo da denúncia:");
    if (!reason?.trim()) return;

    try {
      const res = await fetch(`/api/messages/${messageId}/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        alert("Mensagem denunciada com sucesso.");
      }
    } catch (err) {
      console.error("Failed to report:", err);
    }
  };

  if (authLoading || loading) {
    return <div className="h-screen flex items-center justify-center">A carregar...</div>;
  }

  if (!conversation) {
    return <div className="h-screen flex items-center justify-center">Conversa não encontrada</div>;
  }

  const otherUser =
    conversation.initiatorId === user?.id
      ? conversation.participant
      : conversation.initiator;

  const context = conversation.photo?.name || conversation.event?.title || "Conversa";

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{otherUser.name}</h1>
          <p className="text-sm text-gray-500">{context}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`group max-w-xs px-4 py-2 rounded-lg ${
                  isOwn
                    ? "bg-[#09419b] text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwn ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("pt", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {!isOwn && (
                  <button
                    onClick={() => handleReportMessage(msg.id)}
                    className="text-xs opacity-0 group-hover:opacity-100 transition mt-2 text-red-500 hover:text-red-700"
                  >
                    Denunciar
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 p-4 flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escrever mensagem..."
          disabled={sending}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-[#09419b]"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-6 py-2 bg-[#09419b] text-white rounded-full font-semibold disabled:opacity-50 hover:bg-[#09419b]/90 transition"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
