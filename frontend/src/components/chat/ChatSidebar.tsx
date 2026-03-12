import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { type Conversation, type Profile } from "../../types/chat";
import styles from "./ChatSidebar.module.css";

interface Props {
  currentProfile: Profile;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
}

function ChatSidebar({
  currentProfile,
  activeConversationId,
  onSelect,
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Fetch ALL conversations where the current user is either artisan or customer
    supabase
      .from("conversations")
      .select("*, artisan:artisan_id(*), customer:customer_id(*)")
      .or(
        `artisan_id.eq.${currentProfile.id},customer_id.eq.${currentProfile.id}`,
      )
      .order("updated_at", { ascending: false })
      .then(({ data }) => setConversations(data ?? []));

    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        async (payload) => {
          const raw = payload.new as Conversation;
          const isParticipant =
            raw.artisan_id === currentProfile.id ||
            raw.customer_id === currentProfile.id;
          if (!isParticipant) return;

          // Re-fetch with joins so title + profile names are present
          const { data } = await supabase
            .from("conversations")
            .select("*, artisan:artisan_id(*), customer:customer_id(*)")
            .eq("id", raw.id)
            .single();

          if (data) {
            setConversations((prev) => [data as Conversation, ...prev]);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === payload.new.id
                ? { ...conv, ...(payload.new as Conversation) }
                : conv,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfile]);

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.heading}>Messages</h3>
      <ul className={styles.list}>
        {conversations.map((conv) => {
          const other =
            currentProfile.id === conv.artisan_id
              ? conv.customer
              : conv.artisan;
          const isActive = conv.id === activeConversationId;

          // Fallback: if title is null/empty, show "Chat with <other name>"
          const displayTitle =
            conv.title?.trim() || `Chat with ${other?.name ?? "User"}`;

          return (
            <li
              key={conv.id}
              className={`${styles.item} ${isActive ? styles.active : ""}`}
              onClick={() => onSelect(conv.id)}
            >
              <div className={styles.itemTitle}>
                {conv.status === "CLOSED" && (
                  <span className={styles.lock}>🔒</span>
                )}
                <span>{displayTitle}</span>
              </div>
              <p className={styles.itemSub}>{other?.name ?? "Unknown"}</p>
            </li>
          );
        })}
        {conversations.length === 0 && (
          <p className={styles.empty}>No conversations yet.</p>
        )}
      </ul>
    </aside>
  );
}

export default ChatSidebar;
