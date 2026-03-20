import { useEffect, useState } from "react";
import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import styles from "./DashboardLayout.module.css";
import { supabase } from "../lib/supabase";
import { type Profile, type Product } from "../types/chat";
import AddProductModal from "../components/products/AddProductModal";
import { OPEN_EDIT_PRODUCT_MODAL_EVENT } from "../pages/dashboard/ArtisanDashboard";

const UNREAD_COUNT_EVENT = "notifications:unread-count-changed";
export const PRODUCT_SAVED_EVENT = "dashboard:product-saved";

function DashboardLayout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    function handleUnreadCountChange(event: Event) {
      const customEvent = event as CustomEvent<{ unreadCount: number }>;
      setUnreadCount(customEvent.detail?.unreadCount ?? 0);
    }
    
    function handleOpenEditModal(event: Event) {
      const customEvent = event as CustomEvent<{ product: Product }>;
      setEditingProduct(customEvent.detail.product);
      setIsModalOpen(true);
    }

    window.addEventListener(
      UNREAD_COUNT_EVENT,
      handleUnreadCountChange as EventListener,
    );
    window.addEventListener(
      OPEN_EDIT_PRODUCT_MODAL_EVENT,
      handleOpenEditModal as EventListener,
    );
    
    return () => {
      window.removeEventListener(
        UNREAD_COUNT_EVENT,
        handleUnreadCountChange as EventListener,
      );
      window.removeEventListener(
        OPEN_EDIT_PRODUCT_MODAL_EVENT,
        handleOpenEditModal as EventListener,
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

  // Helper for NavLink styling
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;

  return (
    <div className={styles.page}>
      
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h1 className={styles.brandTitle}><span style={{fontFamily: 'var(--font-hindi)'}}>कला</span>kriti</h1>
          <p className={styles.brandSubtitle}>The Digital Curator</p>
        </div>
        
        <nav className={styles.nav}>
          <NavLink to="/dashboard" end className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`} style={{fontVariationSettings: "'FILL' 1"}}>dashboard</span>
            <span className={styles.navLinkText}>Dashboard</span>
          </NavLink>
          <NavLink to="/dashboard/products" className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`}>storefront</span>
            <span className={styles.navLinkText}>Products</span>
          </NavLink>
          <NavLink to="/dashboard/courses" className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`}>school</span>
            <span className={styles.navLinkText}>Courses</span>
          </NavLink>
          <NavLink to="/dashboard/artisans" className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`}>brush</span>
            <span className={styles.navLinkText}>Artisans</span>
          </NavLink>
          <NavLink to="/dashboard/messages" className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`}>mail</span>
            <span className={styles.navLinkText}>Messages</span>
          </NavLink>
          <NavLink to="/dashboard/notifications" className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`}>notifications</span>
            <span className={styles.navLinkText}>Notifications</span>
            {unreadCount > 0 && (
              <span className={styles.navBadge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>
        </nav>

        <div className={styles.sidebarBottom}>
          <button
            className={styles.newCollectionBtn}
            onClick={() => {
              if (profile?.role === "artisan") {
                setEditingProduct(null);
                setIsModalOpen(true);
              } else {
                navigate("/dashboard/products");
              }
            }}
          >
            <span className={`material-symbols-outlined ${styles.navIcon}`}>add_circle</span>
            New Collection
          </button>
          
          <div className={styles.profileSummary}>
            <div className={styles.profileAvatarBox}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className={styles.profileImg} />
              ) : (
                <span className="material-symbols-outlined" style={{color: 'white', margin: '6px'}}>person</span>
              )}
            </div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{profile?.name ?? "Loading..."}</p>
              <p className={styles.profileRole}>{profile?.role ?? "Guest"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={styles.mainWrapper}>
        
        {/* TOP NAV ACTIONS ONLY */}
        <div className={styles.topNav}>
          <div className={styles.topNavRight}>
            <div className={styles.navActions}>
              <button className={styles.iconBtn} onClick={() => navigate("/dashboard/notifications")}>
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && <span className={styles.notifDot}></span>}
              </button>
              <button className={styles.iconBtn} onClick={handleLogout} title="Logout">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content Container */}
        <div className={styles.contentContainer}>
          <Outlet />
        </div>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.activeFooterLink}>The Curator's Story</a>
            <a href="#">Artisan Directory</a>
            <a href="#">Heritage Blog</a>
            <a href="#">Sustainability</a>
            <a href="#">Contact</a>
          </div>
          <div className={styles.footerBrand}>कलाkriti Heritage Editorial</div>
          <p className={styles.footerCopyright}>© 2024 कलाkriti Heritage Editorial. All rights reserved.</p>
        </footer>

      </main>

      {isModalOpen && profile?.role === "artisan" && (
        <AddProductModal
          artisanId={profile.id}
          existingProduct={editingProduct!}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
            window.dispatchEvent(new Event(PRODUCT_SAVED_EVENT));
          }}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
