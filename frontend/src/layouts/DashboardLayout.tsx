import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import styles from "./DashboardLayout.module.css";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { type Profile } from "../types/chat";

const UNREAD_COUNT_EVENT = "notifications:unread-count-changed";

function DashboardLayout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function handleUnreadCountChange(event: Event) {
      const customEvent = event as CustomEvent<{ unreadCount: number }>;
      setUnreadCount(customEvent.detail?.unreadCount ?? 0);
    }

    window.addEventListener(
      UNREAD_COUNT_EVENT,
      handleUnreadCountChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        UNREAD_COUNT_EVENT,
        handleUnreadCountChange as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session || !isMounted) return;
      const uid = data.session.user.id;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();
      if (isMounted) setProfile(profileData);

      // Fetch unread count
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("is_read", false);
      if (isMounted) setUnreadCount(count ?? 0);

      // Real-time: new notification arrives
      channel = supabase
        .channel(`notifications-badge-${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          () => {
            if (isMounted) setUnreadCount((prev) => prev + 1);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          async () => {
            const { count: fresh } = await supabase
              .from("notifications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", uid)
              .eq("is_read", false);
            if (isMounted) setUnreadCount(fresh ?? 0);
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

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatar} />
          )}
          <div>
            <p className={styles.username}>{profile?.name ?? "Loading..."}</p>
            <p className={styles.userType}>{profile?.role ?? ""}</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* Bell icon with live unread badge */}
          <button
            className={styles.bellBtn}
            onClick={() => navigate("/dashboard/notifications")}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className={styles.bellBadge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <Button onClick={() => navigate("/edit-profile")}>
            Edit Profile
          </Button>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <Link to="/dashboard/products">Products</Link>
            <Link to="/dashboard/courses">Courses</Link>
            <Link to="/dashboard/artisans">Artisans</Link>
            <Link to="/dashboard/messages">Messages</Link>
            <Link to="/dashboard/notifications" className={styles.notifLink}>
              Notifications
              {unreadCount > 0 && (
                <span className={styles.badge}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/dashboard">Back to Dashboard</Link>
          </nav>
        </aside>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
