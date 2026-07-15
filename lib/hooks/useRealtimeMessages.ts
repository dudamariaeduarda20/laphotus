import { useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtimeMessages(
  conversationId: string,
  onNewMessage: (message: any) => void
) {
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          onNewMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onNewMessage]);
}
