import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { type Conversation, type Profile } from "../../types/chat";
import styles from "./ChatSidebar.module.css";
import NewChatDialog from "./NewChatDialog";

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
  const [newChatOpen, setNewChatOpen] = useState(false);

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
    <>
      <aside className={styles.sidebar}>
      <div className={styles.headingWrapper}>
        <h3 className={styles.heading}>Inbox</h3>
        <span
          className={`material-symbols-outlined ${styles.headingIcon}`}
          onClick={() => setNewChatOpen(true)}
          title="New Conversation"
        >edit_square</span>
      </div>
      <ul className={styles.list}>
        {conversations.map((conv) => {
          const other =
            currentProfile.id === conv.artisan_id
              ? conv.customer
              : conv.artisan;
          const isActive = conv.id === activeConversationId;
          const displayTitle = conv.title?.trim() || other?.name || "Unknown User";

          return (
            <li
              key={conv.id}
              className={`${styles.item} ${isActive ? styles.active : ""}`}
              onClick={() => onSelect(conv.id)}
            >
              <div className={styles.itemAvatar}>
                {other?.avatar_url ? (
                  <img src={other.avatar_url} alt={displayTitle} />
                ) : (
                  <span className={styles.itemAvatarFallback}>{displayTitle.charAt(0)}</span>
                )}
                {/* Active marker for everyone by default to simulate real presence based on UI */}
                <div className={styles.itemStatusDot}></div>
              </div>

              <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                  <h4 className={styles.itemTitle}>{displayTitle}</h4>
                  <span className={styles.itemTime}>
                    {new Date(conv.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className={styles.itemSub}>
                  {conv.status === "CLOSED" ? "🔒 Archived" : "View conversation..."}
                </p>
              </div>

              {isActive && <div className={styles.activeDot}></div>}
            </li>
          );
        })}
        {conversations.length === 0 && (
          <p className={styles.empty}>No conversations yet.</p>
        )}
      </ul>
      </aside>

      {newChatOpen && (
        <NewChatDialog
          currentProfile={currentProfile}
          onClose={() => setNewChatOpen(false)}
          onConversationStarted={(id) => {
            setNewChatOpen(false);
            onSelect(id);
          }}
        />
      )}
    </>
  );
}

export default ChatSidebar;
