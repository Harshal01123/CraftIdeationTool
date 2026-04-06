import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { type Notification, type Message, type Conversation } from "../../types/chat";
import styles from "./Notifications.module.css";
import { useTranslation } from "react-i18next";

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isYesterday(dateStr: string) {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

// A generic UI Notification interface that merges both System Notifications and Chat Notifications
interface UINotification {
  id: string; // the physical ID for system, or the conversationId for chat
  type: "system" | "chat";
  conversation_id: string | null;
  title: string;
  body: string | null;
  created_at: string;
  is_read: boolean;
  unread_count?: number; // Only for chat
  system_icon?: string; // Icon for system notification (e.g., shopping_bag, school)
}

function groupByDate(notifications: UINotification[]) {
  const groups: { label: string; items: UINotification[] }[] = [];
  const today: UINotification[] = [];
  const yesterday: UINotification[] = [];
  const older: UINotification[] = [];

  for (const n of notifications) {
    if (isToday(n.created_at)) today.push(n);
    else if (isYesterday(n.created_at)) yesterday.push(n);
    else older.push(n);
  }

  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (older.length) groups.push({ label: "Earlier", items: older });
  return groups;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes || 1}m ago`;
  }
  if (diffInMinutes < 1440 && isToday(dateStr)) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  }
  
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sysNotifs, setSysNotifs] = useState<Notification[]>([]);
  const [unreadChatMsgs, setUnreadChatMsgs] = useState<(Message & { conversation?: Conversation })[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Derive consolidated Virtual Notifications from unread messages
  const virtualChatNotifs = useMemo(() => {
    if (!userId) return [];
    
    // Group by conversation
    const grouped = new Map<string, (Message & { conversation?: Conversation })[]>();
    for (const msg of unreadChatMsgs) {
      if (!grouped.has(msg.conversation_id)) grouped.set(msg.conversation_id, []);
      grouped.get(msg.conversation_id)!.push(msg);
    }

    const chats: UINotification[] = [];
    grouped.forEach((msgs, convId) => {
      // Sort messages ascending by time to find the newest easily
      msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const latestMsg = msgs[0];
      const conv = latestMsg.conversation;
      
      const otherPerson = conv ? (conv.artisan_id === userId ? conv.customer : conv.artisan) : null;
      const title = otherPerson?.name || "Someone";
      
      // If the latest unread is an OFFER, it is an Order notification
      if (latestMsg.type === "OFFER") {
         let productName = "a product";
         try {
           const payload = JSON.parse(latestMsg.content);
           productName = payload.productName || productName;
         } catch {}

         chats.push({
           id: latestMsg.id, // unique per message so it stays separate
           type: "system", // Map OFFER to system so it enters Orders tab
           conversation_id: convId,
           title: "New Order Detail",
           body: `${title} updated the offer for ${productName}.`,
           created_at: latestMsg.created_at,
           is_read: false,
           system_icon: "shopping_bag"
         });
      } else {
         // It's a TEXT message
         const textContent = latestMsg.type === "SYSTEM" ? "System Message" : latestMsg.content;
         
         // If there are multiple unread texts, show preview + count
         let preview = textContent;
         if (msgs.length > 1) {
             preview = `${msgs.length} messages: ${textContent.substring(0, 30)}...`;
         }

         chats.push({
           id: convId, // group by chat
           type: "chat",
           conversation_id: convId,
           title: title,
           body: preview,
           created_at: latestMsg.created_at,
           is_read: false,
           unread_count: msgs.length,
         });
      }
    });
    return chats;
  }, [unreadChatMsgs, userId]);

  const allNotifications = useMemo(() => {
    const wrappedSys: UINotification[] = sysNotifs
      // Filter out raw JSON payloads generated from legacy DB triggers
      .filter(n => !(n.body && n.body.includes('"offerId":')))
      .map(n => {
        // Guess the icon based on the title or body
        let icon = "notifications";
        const t = n.title.toLowerCase();
        if (t.includes("order") || t.includes("shipp") || t.includes("purchase")) icon = "shopping_bag";
        if (t.includes("course") || t.includes("lesson") || t.includes("learn")) icon = "school";

        return {
          id: n.id,
          type: "system",
          conversation_id: n.conversation_id,
          title: n.title,
          body: n.body,
          created_at: n.created_at,
          is_read: n.is_read,
          system_icon: icon
        };
      });

    let merged = [...wrappedSys, ...virtualChatNotifs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return merged;
  }, [sysNotifs, virtualChatNotifs]);

  useEffect(() => {
    let isMounted = true;
    let sysChannel: ReturnType<typeof supabase.channel> | null = null;
    let msgChannel: ReturnType<typeof supabase.channel> | null = null;

    async function loadData() {
      const { data } = await supabase.auth.getSession();
      if (!data.session || !isMounted) return;
      const uid = data.session.user.id;
      setUserId(uid);

      // 1. Fetch System Notifications
      const { data: rows } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (isMounted) setSysNotifs(rows ?? []);

      // 2. Fetch Unread Messages directly
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, artisan_id, customer_id, artisan:artisan_id(*), customer:customer_id(*)")
        .or(`artisan_id.eq.${uid},customer_id.eq.${uid}`);

      if (convs && convs.length > 0) {
        const convIds = convs.map(c => c.id);
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .in("conversation_id", convIds)
          .neq("sender_id", uid)
          .or("is_read.eq.false,is_read.is.null");

        if (msgs && isMounted) {
          const enriched = msgs.map(m => ({
            ...m,
            conversation: convs.find(c => c.id === m.conversation_id)
          }));
          setUnreadChatMsgs(enriched);
        }
      }

      // 3. Realtime listening
      sysChannel = supabase
        .channel(`notifications-page-sys-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          async () => {
             // Refetch sys notifications
             const { data: refresh } = await supabase
               .from("notifications")
               .select("*")
               .eq("user_id", uid)
               .order("created_at", { ascending: false });
             if (isMounted) setSysNotifs(refresh ?? []);
          }
        )
        .subscribe();

      msgChannel = supabase
        .channel(`notifications-page-msg-inbox-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          async () => {
            // Simple refresh for now
            if (!convs || convs.length === 0) return;
            const convIds = convs.map(c => c.id);
            const { data: refetchedMsgs } = await supabase
              .from("messages")
              .select("*")
              .in("conversation_id", convIds)
              .neq("sender_id", uid)
              .or("is_read.eq.false,is_read.is.null");
            
            if (refetchedMsgs && isMounted) {
              const enriched = refetchedMsgs.map(m => ({
                ...m,
                conversation: convs.find(c => c.id === m.conversation_id)
              }));
              setUnreadChatMsgs(enriched);
            } else if (isMounted) {
              setUnreadChatMsgs([]);
            }
          }
        )
        .subscribe();
    }

    loadData();

    return () => {
      isMounted = false;
      if (sysChannel) supabase.removeChannel(sysChannel);
      if (msgChannel) supabase.removeChannel(msgChannel);
    };
  }, []);

  async function markAsRead(n: UINotification) {
    if (n.type === "system") {
      if (n.id.includes("-")) { // if it's an actual SYSTEM notification UUID row
        await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
        setSysNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      } else { // It's an mapped OFFER msg bypassing standard system
        await supabase.from("messages").update({ is_read: true }).eq("id", n.id);
        setUnreadChatMsgs(prev => prev.filter(x => x.id !== n.id));
      }
    } else {
      // Mark all messages in this conversation as read
      await supabase.from("messages").update({ is_read: true }).eq("conversation_id", n.id).neq("sender_id", userId).or("is_read.eq.false,is_read.is.null");
      setUnreadChatMsgs(prev => prev.filter(x => x.conversation_id !== n.id));
    }
    window.dispatchEvent(new Event("notifications:unread-count-changed")); // Force global bell sync
  }

  async function markAllAsRead() {
    if (!userId) return;
    
    // Mark system (allowing null bypass identically to chat if legacy bug)
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).or("is_read.eq.false,is_read.is.null");
    setSysNotifs(prev => prev.map(x => ({ ...x, is_read: true })));

    // Mark chat
    if (unreadChatMsgs.length > 0) {
      const convIds = Array.from(new Set(unreadChatMsgs.map(m => m.conversation_id)));
      await supabase.from("messages").update({ is_read: true }).in("conversation_id", convIds).neq("sender_id", userId).or("is_read.eq.false,is_read.is.null");
      setUnreadChatMsgs([]);
    }
    window.dispatchEvent(new Event("notifications:unread-count-changed")); // Force global bell sync
  }

  async function handleClick(n: UINotification) {
    if (!n.is_read) await markAsRead(n);
    if (n.conversation_id) {
      navigate(`/dashboard/messages?conversation=${n.conversation_id}`);
    }
  }

  const groups = groupByDate(allNotifications);

  return (
    <div className={styles.page}>
      
      <div className={styles.header}>
        <button className={styles.markAllBtn} onClick={markAllAsRead}>
          {t("extended.markAllAsRead")}
        </button>
      </div>

      {allNotifications.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <h4 className={styles.emptyTitle}>{t("extended.youAreCaughtUp")}</h4>
          <p className={styles.emptyBody}>
            {t("extended.dashboardPristine")}
          </p>
        </div>
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <div key={group.label} className={styles.group}>
              <h3 className={styles.groupLabel}>{group.label}</h3>
              <ul className={styles.list}>
                {group.items.map((n) => {
                  
                  if (n.type === "system") {
                    return (
                      <li
                        key={n.id}
                        className={`${styles.itemSystem} ${n.is_read ? styles.itemChatRead : ""}`}
                        onClick={() => handleClick(n)}
                      >
                        {!n.is_read && <div className={styles.unreadDot} />}
                        <div className={styles.iconWrapSystem}>
                          <span className="material-symbols-outlined" style={!n.is_read ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            {n.system_icon}
                          </span>
                        </div>
                        <div className={styles.content}>
                          <div className={styles.topRow}>
                             <h4 className={styles.title}>{n.title}</h4>
                             <span className={styles.time}>{formatTime(n.created_at)}</span>
                          </div>
                          {n.body && <p className={styles.body}>{n.body}</p>}
                        </div>
                      </li>
                    );
                  }

                  // Chat Message Node
                  return (
                    <li
                      key={n.id}
                      className={`${styles.itemChat} ${n.is_read ? styles.itemChatRead : ""}`}
                      onClick={() => handleClick(n)}
                    >
                      <div className={styles.iconWrapChat}>
                        <span className="material-symbols-outlined">mail</span>
                      </div>
                      <div className={styles.content}>
                        <div className={styles.topRow}>
                          <div className={styles.chatInfo}>
                            <h4 className={styles.chatTitle}>{n.title}</h4>
                            <p className={styles.chatBody}>{n.body}</p>
                            <span className={styles.chatTime}>{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          {!n.is_read && (
                            <button
                              className={styles.markReadChatBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n);
                              }}
                            >
                              {t("extended.markRead")}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );

                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
