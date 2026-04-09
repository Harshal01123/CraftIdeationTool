import { useEffect, useState, useCallback } from "react";
import Hamburger from "hamburger-react";
import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./DashboardLayout.module.css";
import { supabase } from "../lib/supabase";
import { type Profile, type Product } from "../types/chat";
import AddProductModal from "../components/products/AddProductModal";
import CreateCourseModal from "../components/courses/CreateCourseModal";
import WishlistPopup from "../components/products/WishlistPopup";
import BugReport from "../components/BugReport";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { OPEN_EDIT_PRODUCT_MODAL_EVENT } from "../pages/dashboard/ArtisanDashboard";
import { OPEN_EDIT_COURSE_MODAL_EVENT } from "../pages/dashboard/MyCourses";
import { useMode } from "../contexts/ModeContext";
import Walkthrough from "../components/Walkthrough";

const UNREAD_COUNT_EVENT = "notifications:unread-count-changed";
export const PRODUCT_SAVED_EVENT = "dashboard:product-saved";
export const COURSE_SAVED_EVENT = "dashboard:course-saved";

function DashboardLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeMode, setActiveMode, availableModes } = useMode();

  // Determine page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/my-products")) return t("nav.myProducts");
    if (path.includes("/my-courses")) return t("nav.myCourses");
    if (path.includes("/products")) return t("nav.products");
    if (path.includes("/courses")) return t("nav.courses");
    if (path.includes("/artisans")) return t("nav.artisans");
    if (path.includes("/messages")) return t("nav.messages");
    if (path.includes("/notifications")) return t("dashboard.notifications");
    if (path.includes("/profile")) return t("dashboard.editProfile");
    return t("nav.dashboard");
  };

  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Walkthrough state
  const [walkthroughRun, setWalkthroughRun] = useState(false);
  const [walkthroughReady, setWalkthroughReady] = useState(false);

  // WhatsApp-style dynamic toast
  const [toastVisible, setToastVisible] = useState(false);
  const [chatOnlyCount, setChatOnlyCount] = useState(0);

  // Trigger for manual refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setSearchQuery("");
  }, [location.pathname]);

  useEffect(() => {
    function handleUnreadCountChange() {
      setRefreshTrigger((prev) => prev + 1);
    }

    function handleOpenEditModal(event: Event) {
      const customEvent = event as CustomEvent<{ product: Product }>;
      setEditingProduct(customEvent.detail.product);
      setIsModalOpen(true);
    }

    function handleOpenEditCourseModal(event: Event) {
      const customEvent = event as CustomEvent<{ course: any }>;
      setEditingCourse(customEvent.detail.course);
      setIsCourseModalOpen(true);
    }

    window.addEventListener(
      OPEN_EDIT_PRODUCT_MODAL_EVENT,
      handleOpenEditModal as EventListener,
    );
    window.addEventListener(
      OPEN_EDIT_COURSE_MODAL_EVENT,
      handleOpenEditCourseModal as EventListener,
    );
    window.addEventListener(UNREAD_COUNT_EVENT, handleUnreadCountChange);

    return () => {
      window.removeEventListener(
        OPEN_EDIT_PRODUCT_MODAL_EVENT,
        handleOpenEditModal as EventListener,
      );
      window.removeEventListener(
        OPEN_EDIT_COURSE_MODAL_EVENT,
        handleOpenEditCourseModal as EventListener,
      );
      window.removeEventListener(UNREAD_COUNT_EVENT, handleUnreadCountChange);
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
      if (isMounted) {
        setProfile(profileData);
        // Auto-start walkthrough for first-time users
        if (profileData && profileData.has_completed_walkthrough === false) {
          setTimeout(() => {
            setWalkthroughReady(true);
            setWalkthroughRun(true);
          }, 800);
        } else {
          setWalkthroughReady(true);
        }
      }

      async function fetchUnreadCount() {
        if (!isMounted) return;

        // 1. System Notifications
        const { count: sysCount } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("is_read", false);

        // 2. Chat Notifications
        let chatCount = 0;
        const { data: convs } = await supabase
          .from("conversations")
          .select("id")
          .or(`artisan_id.eq.${uid},customer_id.eq.${uid}`);

        if (convs && convs.length > 0) {
          const ids = convs.map((c) => c.id);
          const { count: msgCount } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .in("conversation_id", ids)
            .neq("sender_id", uid)
            .or("is_read.eq.false,is_read.is.null");
          chatCount = msgCount ?? 0;
        }

        if (isMounted) {
          setUnreadCount((sysCount ?? 0) + chatCount);
          setChatOnlyCount(chatCount);
        }
      }

      await fetchUnreadCount();

      await fetchUnreadCount();

      // Real-time: new message or notification arrives
      channel = supabase
        .channel(`global-badges-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          (payload) => {
            fetchUnreadCount();
            if (
              payload.eventType === "INSERT" &&
              payload.new.sender_id !== uid
            ) {
              setToastVisible(true);
              setTimeout(() => setToastVisible(false), 4500);
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications" },
          () => fetchUnreadCount(),
        )
        .subscribe();
    }

    init();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const handleWalkthroughFinish = useCallback(async () => {
    setWalkthroughRun(false);
    // Mark walkthrough as completed in Supabase
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await supabase
        .from("profiles")
        .update({ has_completed_walkthrough: true })
        .eq("id", data.session.user.id);
    }
  }, []);

  const handleReplayWalkthrough = useCallback(() => {
    setWalkthroughRun(false);
    setTimeout(() => setWalkthroughRun(true), 100);
  }, []);

  // Helper for NavLink styling
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;

  return (
    <div className={styles.page}>
      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.brand} data-tour="brand">
          <div style={{ marginLeft: "-8px", display: "flex", alignItems: "center" }}>
            <Hamburger
              toggled={!isSidebarCollapsed}
              toggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              size={20}
              color="var(--primary)"
            />
          </div>
          <div className={`${styles.brandText} ${isSidebarCollapsed ? styles.brandTextCollapsed : ""}`}>
            <h1 className={styles.brandTitle}>CraftConnect</h1>
            <p className={styles.brandSubtitle}>{t('dashboard.brandSubtitle')}</p>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/dashboard" end className={navClass}>
            <span
              className={`material-symbols-outlined ${styles.navIcon}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              dashboard
            </span>
            <span className={styles.navLinkText}>{t('nav.dashboard')}</span>
          </NavLink>
          <div className={`${styles.navTransitionBox} ${activeMode !== "learner" ? styles.navTransitionBoxOpen : ""}`}>
            <div className={styles.navTransitionInner}>
              <NavLink
                data-tour="nav-products"
                to={
                  activeMode === "artisan"
                    ? "/dashboard/my-products"
                    : "/dashboard/products"
                }
                className={navClass}
              >
                <span className={`material-symbols-outlined ${styles.navIcon}`}>
                  storefront
                </span>
                <span className={styles.navLinkText}>
                  {activeMode === "artisan" ? t('nav.myProducts') : t('nav.products')}
                </span>
              </NavLink>
            </div>
          </div>
          <div className={`${styles.navTransitionBox} ${activeMode !== "customer" ? styles.navTransitionBoxOpen : ""}`}>
            <div className={styles.navTransitionInner}>
              <NavLink
                data-tour="nav-courses"
                to={
                  activeMode === "artisan"
                    ? "/dashboard/my-courses"
                    : "/dashboard/courses"
                }
                className={navClass}
              >
                <span className={`material-symbols-outlined ${styles.navIcon}`}>
                  school
                </span>
                <span className={styles.navLinkText}>
                  {activeMode === "artisan" ? t('nav.myCourses') : t('nav.courses')}
                </span>
              </NavLink>
            </div>
          </div>
          <div className={`${styles.navTransitionBox} ${activeMode === "learner" ? styles.navTransitionBoxOpen : ""}`}>
            <div className={styles.navTransitionInner}>
              <NavLink to="/dashboard/certificates" className={navClass}>
                <span className={`material-symbols-outlined ${styles.navIcon}`}>
                  verified
                </span>
                <span className={styles.navLinkText}>{t('nav.certificates')}</span>
              </NavLink>
            </div>
          </div>
          <NavLink to="/dashboard/artisans" end className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`}>
              brush
            </span>
            <span className={styles.navLinkText}>{t('nav.artisans')}</span>
          </NavLink>
          <NavLink data-tour="nav-messages" to="/dashboard/messages" className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`}>
              mail
            </span>
            <span className={styles.navLinkText}>{t('nav.messages')}</span>
          </NavLink>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={`${styles.navTransitionBox} ${activeMode === "artisan" ? styles.navTransitionBoxOpen : ""}`}>
            <div className={styles.navTransitionInner}>
              <button
                className={styles.newCollectionBtn}
                style={{ marginBottom: "0.5rem" }}
                onClick={() => setIsCourseModalOpen(true)}
              >
                <span className={`material-symbols-outlined ${styles.navIcon}`}>
                  library_add
                </span>
                <span className={styles.newCollectionText}>{t('dashboard.newCourse')}</span>
              </button>
              <button
                className={styles.newCollectionBtn}
                onClick={() => {
                  setEditingProduct(null);
                  setIsModalOpen(true);
                }}
              >
                <span className={`material-symbols-outlined ${styles.navIcon}`}>
                  add_circle
                </span>
                <span className={styles.newCollectionText}>{t('dashboard.newCollection')}</span>
              </button>
            </div>
          </div>

          <div className={styles.profileNavWrapper}>
            {profile && (
              <NavLink
                to={`/dashboard/artisans/${profile.id}`}
                className={navClass}
              >
                <span className={`material-symbols-outlined ${styles.navIcon}`}>
                  person
                </span>
                <span className={styles.navLinkText}>{t('dashboard.profile')}</span>
              </NavLink>
            )}
            <NavLink to="/dashboard/profile" className={navClass}>
              <span className={`material-symbols-outlined ${styles.navIcon}`}>
                settings
              </span>
              <span className={styles.navLinkText}>{t('dashboard.settings')}</span>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={`${styles.mainWrapper} ${isSidebarCollapsed ? styles.mainWrapperCollapsed : ""}`}>
        {/* TOP NAV ACTIONS ONLY */}
        <div className={styles.topNav}>
          <div className={styles.topNavLeft}>
            <h2 className={styles.navPageTitle}>{getPageTitle()}</h2>
          </div>

          <div className={styles.modeSwitcher} data-tour="mode-switcher">
            {availableModes.includes("artisan") && (
              <button
                className={`${styles.modeBtn} ${activeMode === "artisan" ? styles.modeBtnActive : ""}`}
                onClick={() => {
                  setActiveMode("artisan");
                  navigate("/dashboard");
                }}
              >
                {t('extended.modeArtisan')}
              </button>
            )}
            {availableModes.includes("customer") && (
              <button
                className={`${styles.modeBtn} ${activeMode === "customer" ? styles.modeBtnActive : ""}`}
                onClick={() => {
                  setActiveMode("customer");
                  navigate("/dashboard");
                }}
              >
                {t('extended.modeCustomer')}
              </button>
            )}
            {availableModes.includes("learner") && (
              <button
                className={`${styles.modeBtn} ${activeMode === "learner" ? styles.modeBtnActive : ""}`}
                onClick={() => {
                  setActiveMode("learner");
                  navigate("/dashboard");
                }}
              >
                {t('extended.modeLearner')}
              </button>
            )}
          </div>

          <div className={styles.topNavRight}>
            {(location.pathname === "/dashboard/products" ||
              location.pathname === "/dashboard/courses" ||
              location.pathname === "/dashboard/artisans") && (
              <div className={styles.headerSearchBox}>
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder={`${t('dashboard.search')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            <div className={styles.navActions} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ marginRight: '0.5rem' }}>
                <LanguageSwitcher />
              </div>
              <button
                data-tour="wishlist-btn"
                className={styles.iconBtn}
                title={t('dashboard.wishlist')}
                onClick={() => setWishlistOpen(true)}
              >
                <span className="material-symbols-outlined">favorite</span>
              </button>

              <button
                data-tour="notifications-btn"
                className={styles.iconBtn}
                onClick={() => navigate("/dashboard/notifications")}
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {walkthroughReady && (
                <button
                  data-tour="replay-btn"
                  className={styles.iconBtn}
                  title="Replay Walkthrough"
                  onClick={handleReplayWalkthrough}
                  style={{ position: 'relative' }}
                >
                  <span className="material-symbols-outlined">tour</span>
                </button>
              )}

                <div
                className={styles.headerProfileBox}
                onClick={() =>
                  profile?.id &&
                  navigate(`/dashboard/artisans/${profile.id}`)
                }
                style={{
                  cursor: "pointer",
                }}
                title={t('extended.viewMyProfile')}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className={styles.headerProfileImg}
                  />
                ) : (
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "white", margin: "4px" }}
                  >
                    person
                  </span>
                )}
              </div>

              <button
                className={styles.iconBtn}
                onClick={handleLogout}
                title={t('extended.logout')}
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content Container */}
        <div className={styles.contentContainer}>
          <Outlet context={{ searchQuery, setSearchQuery }} />
        </div>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            {t('extended.heritageBrand')}
          </div>
          <p className={styles.footerCopyright}>
            {t('extended.copyright')}
          </p>
          <BugReport />
        </footer>
      </main>

      {/* Dynamic WhatsApp-style Toast */}
      {toastVisible && chatOnlyCount > 0 && (
        <div className={styles.dynamicToast}>
          <span className="material-symbols-outlined">chat</span>
          <span>
            {t('dashboard.youHave')} {chatOnlyCount} {chatOnlyCount !== 1 ? t('dashboard.newMessages') : t('dashboard.newMessage')}!
          </span>
        </div>
      )}

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

      {isCourseModalOpen && profile?.role === "artisan" && (
        <CreateCourseModal
          artisanId={profile.id}
          existingCourse={editingCourse}
          onClose={() => {
            setIsCourseModalOpen(false);
            setEditingCourse(null);
          }}
          onSaved={() => {
            setIsCourseModalOpen(false);
            setEditingCourse(null);
            window.dispatchEvent(new Event(COURSE_SAVED_EVENT));
          }}
        />
      )}



      {/* WISHLIST POPUP */}
      {wishlistOpen && <WishlistPopup onClose={() => setWishlistOpen(false)} />}

      {/* WALKTHROUGH */}
      {walkthroughReady && (
        <Walkthrough run={walkthroughRun} onFinish={handleWalkthroughFinish} />
      )}
    </div>
  );
}

export default DashboardLayout;
