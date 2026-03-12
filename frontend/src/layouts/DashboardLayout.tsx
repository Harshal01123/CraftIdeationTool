import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import styles from "./DashboardLayout.module.css";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { type Profile } from "../types/chat";

function DashboardLayout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Fetch the logged-in user's profile to display name and role
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .single();
      setProfile(profileData);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        {/* Left: User info */}
        <div className={styles.userInfo}>
          <div className={styles.avatar} />
          <div>
            <p className={styles.username}>{profile?.name ?? "Loading..."}</p>
            <p className={styles.userType}>{profile?.role ?? ""}</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className={styles.headerActions}>
          <Button onClick={() => navigate("/dashboard/notifications")}>
            Notifications
          </Button>
          <Button onClick={() => navigate("/edit-profile")}>
            Edit Profile
          </Button>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      {/* Body */}
      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <Link to="products">Products</Link>
            <Link to="courses">Courses</Link>
            <Link to="artisans">Artisans</Link>
            <Link to="messages">Messages</Link>
            <Link to="">Back to Dashboard</Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
