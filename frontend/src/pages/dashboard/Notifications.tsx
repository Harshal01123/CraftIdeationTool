import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { type Notification } from "../../types/chat";
import styles from "./Notifications.module.css";

const UNREAD_COUNT_EVENT = "notifications:unread-count-changed";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  function emitUnreadCount(unreadCount: number) {
    window.dispatchEvent(
      new CustomEvent<{ unreadCount: number }>(UNREAD_COUNT_EVENT, {
        detail: { unreadCount },
      }),
    );
  }

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session || !isMounted) return;
      const uid = data.session.user.id;
      setUserId(uid);

      const { data: rows } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (!isMounted) return;
      setNotifications(rows ?? []);
      emitUnreadCount((rows ?? []).filter((n) => !n.is_read).length);

      channel = supabase
        .channel(`notifications-page-${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            setNotifications((prev) => {
              const incoming = payload.new as Notification;
              if (prev.some((n) => n.id === incoming.id)) return prev;
              const next = [incoming, ...prev];
              emitUnreadCount(next.filter((n) => !n.is_read).length);
              return next;
            });
          },
        )
        .subscribe();
    }

    init();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      emitUnreadCount(next.filter((n) => !n.is_read).length);
      return next;
    });
  }

  async function markAllAsRead() {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, is_read: true }));
      emitUnreadCount(0);
      return next;
    });
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
