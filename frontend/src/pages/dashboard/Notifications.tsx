import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { type Notification } from "../../types/chat";
import styles from "./Notifications.module.css";

// const icons: Record<Notification["type"], string> = {
//   new_message: "💬",
//   new_conversation: "🤝",
//   conversation_closed: "🔒",
// };

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const uid = data.session.user.id;
      setUserId(uid);

      const { data: rows } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      setNotifications(rows ?? []);

      // Real-time: new notification
      const channel = supabase
        .channel("notifications-page")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, []);

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  }

  async function markAllAsRead() {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleClick(n: Notification) {
    if (!n.is_read) await markAsRead(n.id);
    if (n.conversation_id) {
      navigate(`/dashboard/messages?conversation=${n.conversation_id}`);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>
          Notifications
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className={styles.empty}>You're all caught up!</p>
      ) : (
        <ul className={styles.list}>
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`${styles.item} ${n.is_read ? styles.read : styles.unread}`}
              onClick={() => handleClick(n)}
            >
              <span className={styles.icon}>🟢</span>
              <div className={styles.content}>
                <p className={styles.title}>{n.title}</p>
                {n.body && <p className={styles.body}>{n.body}</p>}
                <p className={styles.time}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && (
                <button
                  className={styles.readBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(n.id);
                  }}
                >
                  Mark read
                </button>
              )}
              {n.is_read && (
                <span className={styles.readDot} title="Read">
                  ✓
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Notifications;
