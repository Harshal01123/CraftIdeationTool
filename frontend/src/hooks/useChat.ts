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

    // 1. Fetch conversation details (with artisan + customer profile joined)
    supabase
      .from("conversations")
      .select("*, artisan:artisan_id(*), customer:customer_id(*)")
      .eq("id", conversationId)
      .single()
      .then(({ data }) => setConversation(data));

    // 2. Fetch full message history, oldest first
    supabase
      .from("messages")
      .select("*, sender:sender_id(*)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoading(false);
      });

    // 3. Remove any previous realtime channel before opening a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // 4. Open a Supabase Realtime channel for live new messages
    // This listens ONLY for INSERT events on this specific conversation
    const channel = supabase
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
          // Guard against duplicates
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    // 5. Cleanup: unsubscribe when conversation changes or component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Send a new TEXT message to Supabase
  async function sendMessage(content: string) {
    if (!conversationId || !currentProfile || !content.trim()) return;

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentProfile.id,
      sender_role: currentProfile.role,
      type: "TEXT",
      content: content.trim(),
    });

    // Bump updated_at so sidebar sorts this conversation to the top
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  // Close the conversation and auto-insert a SYSTEM message
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

    // This insert will also be caught by the realtime channel above
    // so both users see it instantly without a page refresh
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: null,
      sender_role: "system",
      type: "SYSTEM",
      content: `Conversation closed by ${currentProfile.name}.`,
    });

    // Update local state immediately so UI switches to CLOSED view
    setConversation((prev) => (prev ? { ...prev, status: "CLOSED" } : prev));
  }

  return { messages, conversation, loading, sendMessage, closeConversation };
}
