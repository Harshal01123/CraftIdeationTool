import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { type Conversation, type Message, type Profile } from "../types/chat";

export function useChat(
  conversationId: string | null,
  currentProfile: Profile | null,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);
    setMessages([]);
    setConversation(null);

    supabase
      .from("conversations")
      .select("*, artisan:artisan_id(*), customer:customer_id(*)")
      .eq("id", conversationId)
      .single()
      .then(({ data }) => setConversation(data));

    supabase
      .from("messages")
      .select("*, sender:sender_id(*)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoading(false);
      });

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const messagesChannel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          setConversation((prev) => 
            prev ? { ...prev, ...(payload.new as Conversation) } : prev
          );
        }
      )
      .subscribe();

    channelRef.current = messagesChannel;

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [conversationId]);

  // Updated sendMessage to support optional type
  async function sendMessage(
    content: string,
    type: "TEXT" | "SYSTEM" = "TEXT",
  ) {
    if (!conversationId || !currentProfile || !content.trim()) return;

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: type === "SYSTEM" ? null : currentProfile.id,
      sender_role: type === "SYSTEM" ? "system" : currentProfile.role,
      type: type,
      content: content.trim(),
    });

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  async function closeConversation() {
    if (!conversationId || !currentProfile) return;

    await supabase
      .from("conversations")
      .update({
        status: "CLOSED",
        closed_by_id: currentProfile.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    // Encode who closed the chat
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: null,
      sender_role: "system",
      type: "SYSTEM",
      content: `CLOSED_BY:${currentProfile.id}|closed the chat.`,
    });

    setConversation((prev) => (prev ? { ...prev, status: "CLOSED" } : prev));
  }

  return { messages, conversation, loading, sendMessage, closeConversation };
}
