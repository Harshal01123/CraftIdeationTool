import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { type Notification } from "../../types/chat";
import styles from "./Notifications.module.css";

const UNREAD_COUNT_EVENT = "notifications:unread-count-changed";

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

function groupByDate(notifications: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const older: Notification[] = [];

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
  const groups = groupByDate(notifications);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headingGroup}>
          <h2 className={styles.heading}>Notifications</h2>
          <span className={styles.hindiSubtitle}>सूचनाएँ</span>
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.empty}>
          <span className={`material-symbols-outlined ${styles.emptyIcon}`}>
            notifications_none
          </span>
          <p>You&apos;re all caught up!</p>
          <span className={styles.emptySubtext}>
            No notifications at this time.
          </span>
        </div>
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <div key={group.label} className={styles.group}>
              <div className={styles.groupLabel}>{group.label}</div>
              <ul className={styles.list}>
                {group.items.map((n) => (
                  <li
                    key={n.id}
                    className={`${styles.item} ${n.is_read ? styles.read : styles.unread}`}
                    onClick={() => handleClick(n)}
                  >
                    <div className={styles.iconWrap}>
                      <span className={`material-symbols-outlined ${styles.icon}`}>
                        {n.conversation_id ? "mail" : "notifications"}
                      </span>
                      {!n.is_read && <div className={styles.unreadDot} />}
                    </div>
                    <div className={styles.content}>
                      <p className={styles.title}>{n.title}</p>
                      {n.body && <p className={styles.body}>{n.body}</p>}
                      <p className={styles.time}>
                        {new Date(n.created_at).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!n.is_read ? (
                      <button
                        className={styles.readBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                      >
                        Mark read
                      </button>
                    ) : (
                      <span className={styles.readCheck} title="Read">
                        <span className="material-symbols-outlined">check_circle</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
