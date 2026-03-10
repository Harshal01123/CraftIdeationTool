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
    // Fetch conversations where the current user is a participant
    const field =
      currentProfile.role === "artisan" ? "artisan_id" : "customer_id";

    supabase
      .from("conversations")
      .select("*, artisan:artisan_id(*), customer:customer_id(*)")
      .eq(field, currentProfile.id)
      .order("updated_at", { ascending: false }) // most recently active first
      .then(({ data }) => setConversations(data ?? []));

    // Listen for real-time updates to conversations
    // e.g. when status changes to CLOSED or updated_at bumps on new message
    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
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
          // Show the OTHER person's name, not the current user's
          const other =
            currentProfile.role === "artisan" ? conv.customer : conv.artisan;
          const isActive = conv.id === activeConversationId;

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
                <span>{conv.title}</span>
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
