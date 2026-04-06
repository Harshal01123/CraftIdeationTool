import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { type Conversation, type Profile } from "../../types/chat";
import { useMode } from "../../contexts/ModeContext";
import styles from "./ChatSidebar.module.css";
import NewChatDialog from "./NewChatDialog";
import OfferFlowCoordinator from "./OfferFlowCoordinator";
import { useTranslation } from "react-i18next";

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
  const [offerArtisan, setOfferArtisan] = useState<Profile | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { t } = useTranslation();
  const { activeMode } = useMode();
  const isArtisan = activeMode === "artisan";

  useEffect(() => {
    async function loadData() {
      const { data: convs } = await supabase
        .from("conversations")
        .select("*, artisan:artisan_id(*), customer:customer_id(*)")
        .or(`artisan_id.eq.${currentProfile.id},customer_id.eq.${currentProfile.id}`)
        .order("updated_at", { ascending: false });
        
      if (!convs) return;
      setConversations(convs);

      const ids = convs.map(c => c.id);
      if (ids.length > 0) {
        const { data: unreadMsgs } = await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", ids)
          .neq("sender_id", currentProfile.id)
          .or("is_read.eq.false,is_read.is.null");
          
        if (unreadMsgs) {
          const counts: Record<string, number> = {};
          unreadMsgs.forEach(m => {
            counts[m.conversation_id] = (counts[m.conversation_id] || 0) + 1;
          });
          setUnreadCounts(counts);
        }
      }
    }
    
    loadData();

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

    const messagesChannel = supabase
      .channel("sidebar-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg.sender_id !== currentProfile.id) {
            setUnreadCounts(prev => ({
              ...prev,
              [newMsg.conversation_id]: (prev[newMsg.conversation_id] || 0) + 1
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new;
          if (updated.is_read) {
            setUnreadCounts(prev => ({
              ...prev,
              [updated.conversation_id]: 0
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentProfile]);

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.headingWrapper}>
          <h3 className={styles.heading}>{t("app.inbox", "Inbox")}</h3>
          {!isArtisan && (
            <span
              className={`material-symbols-outlined ${styles.headingIcon}`}
              onClick={() => setNewChatOpen(true)}
              title="New Conversation"
            >edit_square</span>
          )}
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
                <p className={`${styles.itemSub} ${unreadCounts[conv.id] > 0 && activeConversationId !== conv.id ? styles.itemSubUnread : ""}`}>
                  {conv.status === "CLOSED" ? "🔒 Archived" : "View conversation..."}
                </p>
              </div>

              <div className={styles.itemRight}>
                {unreadCounts[conv.id] > 0 && activeConversationId !== conv.id && (
                  <span className={styles.unreadBadge}>{unreadCounts[conv.id]}</span>
                )}
                {isActive && <div className={styles.activeDot}></div>}
              </div>
            </li>
          );
        })}
        {conversations.length === 0 && (
          <p className={styles.empty}>{t("extended.emptyMessages")}</p>
        )}
      </ul>
      </aside>

      {newChatOpen && !offerArtisan && (
        <NewChatDialog
          currentProfile={currentProfile}
          onClose={() => setNewChatOpen(false)}
          onArtisanSelected={(artisan) => {
            setOfferArtisan(artisan);
            setNewChatOpen(false);
          }}
        />
      )}

      {offerArtisan && (
        <OfferFlowCoordinator
          isOpen={true}
          onClose={() => setOfferArtisan(null)}
          artisan={offerArtisan}
          onConversationStarted={(id) => {
            setOfferArtisan(null);
            onSelect(id);
          }}
        />
      )}
    </>
  );
}

export default ChatSidebar;
