import { useEffect, useState } from "react";
import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import styles from "./DashboardLayout.module.css";
import { supabase } from "../lib/supabase";
import { type Profile, type Product } from "../types/chat";
import AddProductModal from "../components/products/AddProductModal";
import CreateCourseModal from "../components/courses/CreateCourseModal";
import WishlistPopup from "../components/products/WishlistPopup";
import { OPEN_EDIT_PRODUCT_MODAL_EVENT } from "../pages/dashboard/ArtisanDashboard";
import { useMode } from "../contexts/ModeContext";

const UNREAD_COUNT_EVENT = "notifications:unread-count-changed";
export const PRODUCT_SAVED_EVENT = "dashboard:product-saved";
export const COURSE_SAVED_EVENT = "dashboard:course-saved";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeMode, setActiveMode, availableModes } = useMode();

  // Determine page title based on route
  const getPageTitles = () => {
    const path = location.pathname;
    if (path.includes("/my-products")) return { en: "My Products", hi: "मेरे उत्पाद" };
    if (path.includes("/my-courses")) return { en: "My Courses", hi: "मेरी शिक्षा" };
    if (path.includes("/products")) return { en: "Products", hi: "उत्पाद" };
    if (path.includes("/courses")) return { en: "Courses", hi: "शिक्षा" };
    if (path.includes("/artisans")) return { en: "Artisans", hi: "शिल्पी" };
    if (path.includes("/messages")) return { en: "Messages", hi: "संदेश" };
    if (path.includes("/notifications")) return { en: "Notifications", hi: "सूचनाएं" };
    if (path.includes("/profile")) return { en: "Edit Profile", hi: "प्रोफ़ाइल" };
    return { en: "Dashboard", hi: "डैशबोर्ड" };
  };
  const titles = getPageTitles();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugSubject, setBugSubject] = useState("");
  const [bugContent, setBugContent] = useState("");
  const [bugStatus, setBugStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [wishlistOpen, setWishlistOpen] = useState(false);

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
      setRefreshTrigger(prev => prev + 1);
    }

    function handleOpenEditModal(event: Event) {
      const customEvent = event as CustomEvent<{ product: Product }>;
      setEditingProduct(customEvent.detail.product);
      setIsModalOpen(true);
    }

    window.addEventListener(
      OPEN_EDIT_PRODUCT_MODAL_EVENT,
      handleOpenEditModal as EventListener,
    );
    window.addEventListener(
      UNREAD_COUNT_EVENT,
      handleUnreadCountChange
    );

    return () => {
      window.removeEventListener(
        OPEN_EDIT_PRODUCT_MODAL_EVENT,
        handleOpenEditModal as EventListener,
      );
      window.removeEventListener(
        UNREAD_COUNT_EVENT,
        handleUnreadCountChange
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
            if (payload.eventType === "INSERT" && payload.new.sender_id !== uid) {
               setToastVisible(true);
               setTimeout(() => setToastVisible(false), 4500);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications" },
          () => fetchUnreadCount()
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

  async function handleSendBugReport() {
    if (!bugSubject.trim() || !bugContent.trim()) return;
    setBugStatus("sending");
    try {
      const { error } = await supabase.functions.invoke("send-bug-report", {
        body: { subject: bugSubject, content: bugContent },
      });
      if (error) throw error;
      setBugStatus("sent");
      setTimeout(() => {
        setBugReportOpen(false);
        setBugSubject("");
        setBugContent("");
        setBugStatus("idle");
      }, 1500);
    } catch {
      setBugStatus("error");
    }
  }

  // Helper for NavLink styling
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;

  return (
    <div className={styles.page}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h1 className={styles.brandTitle}>CraftConnect</h1>
          <p className={styles.brandSubtitle}>The Digital Curator</p>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/dashboard" end className={navClass}>
            <span
              className={`material-symbols-outlined ${styles.navIcon}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              dashboard
            </span>
            <span className={styles.navLinkText}>Dashboard</span>
          </NavLink>
          {activeMode !== "learner" && (
            <NavLink
              to={activeMode === "artisan" ? "/dashboard/my-products" : "/dashboard/products"}
              className={navClass}
            >
              <span className={`material-symbols-outlined ${styles.navIcon}`}>
                storefront
              </span>
              <span className={styles.navLinkText}>
                {activeMode === "artisan" ? "My Products" : "Products"}
              </span>
            </NavLink>
          )}
          {activeMode !== "customer" && (
            <NavLink
              to={activeMode === "artisan" ? "/dashboard/my-courses" : "/dashboard/courses"}
              className={navClass}
            >
              <span className={`material-symbols-outlined ${styles.navIcon}`}>
                school
              </span>
              <span className={styles.navLinkText}>
                {activeMode === "artisan" ? "My Courses" : "Courses"}
              </span>
            </NavLink>
          )}
          <NavLink to="/dashboard/artisans" className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`}>
              brush
            </span>
            <span className={styles.navLinkText}>Artisans</span>
          </NavLink>
          <NavLink to="/dashboard/messages" className={navClass}>
            <span className={`material-symbols-outlined ${styles.navIcon}`}>
              mail
            </span>
            <span className={styles.navLinkText}>Messages</span>
          </NavLink>
        </nav>

        <div className={styles.sidebarBottom}>
          {activeMode === "artisan" && (
            <>
              <button
                className={styles.newCollectionBtn}
                style={{ marginBottom: '0.5rem' }}
                onClick={() => setIsCourseModalOpen(true)}
              >
                <span className={`material-symbols-outlined ${styles.navIcon}`}>
                  library_add
                </span>
                New Course
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
                New Collection
              </button>
            </>
          )}

          <div className={styles.profileNavWrapper}>
            <NavLink to="/dashboard/profile" className={navClass}>
              <span className={`material-symbols-outlined ${styles.navIcon}`}>
                account_circle
              </span>
              <span className={styles.navLinkText}>Profile</span>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={styles.mainWrapper}>
        {/* TOP NAV ACTIONS ONLY */}
        <div className={styles.topNav}>
          <div className={styles.topNavLeft}>
            <h2 className={styles.navPageTitle}>{titles.en}</h2>
            <span className={styles.navHindiSubtitle}>{titles.hi}</span>
          </div>

          <div className={styles.modeSwitcher}>
            {availableModes.includes("artisan") && (
              <button 
                className={`${styles.modeBtn} ${activeMode === "artisan" ? styles.modeBtnActive : ""}`}
                onClick={() => setActiveMode("artisan")}
              >
                Artisan
              </button>
            )}
            {availableModes.includes("customer") && (
              <button 
                className={`${styles.modeBtn} ${activeMode === "customer" ? styles.modeBtnActive : ""}`}
                onClick={() => setActiveMode("customer")}
              >
                Customer
              </button>
            )}
            {availableModes.includes("learner") && (
              <button 
                className={`${styles.modeBtn} ${activeMode === "learner" ? styles.modeBtnActive : ""}`}
                onClick={() => setActiveMode("learner")}
              >
                Learner
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
                  placeholder={`Search ${titles.en.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            <div className={styles.navActions}>
              <button
                className={styles.iconBtn}
                title="Wishlist"
                onClick={() => setWishlistOpen(true)}
              >
                <span className="material-symbols-outlined">favorite</span>
              </button>
              
              <button
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

              <div className={styles.headerProfileBox}>
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
                title="Logout"
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
            CraftConnect Heritage Editorial
          </div>
          <p className={styles.footerCopyright}>
            © 2026 CraftConnect Heritage Editorial. All rights reserved.
          </p>
          <button
            className={styles.bugReportBtn}
            onClick={() => { setBugReportOpen(true); setBugStatus("idle"); }}
          >
            <span className="material-symbols-outlined">bug_report</span>
            Report a Bug
          </button>
        </footer>
      </main>

      {/* Dynamic WhatsApp-style Toast */}
      {toastVisible && chatOnlyCount > 0 && (
        <div className={styles.dynamicToast}>
           <span className="material-symbols-outlined">chat</span>
           <span>You have {chatOnlyCount} new message{chatOnlyCount !== 1 ? "s" : ""}!</span>
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
          onClose={() => setIsCourseModalOpen(false)}
          onSaved={() => {
            setIsCourseModalOpen(false);
            window.dispatchEvent(new Event(COURSE_SAVED_EVENT));
          }}
        />
      )}

      {/* BUG REPORT MODAL */}
      {bugReportOpen && (
        <div className={styles.bugOverlay} onClick={() => setBugReportOpen(false)}>
          <div className={styles.bugModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bugModalHeader}>
              <h3 className={styles.bugModalTitle}>Report a Bug</h3>
              <button className={styles.bugCloseBtn} onClick={() => setBugReportOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className={styles.bugModalSubtitle}>Help us improve CraftConnect by describing the issue.</p>

            {bugStatus === "sent" ? (
              <div className={styles.bugSuccess}>
                <span className="material-symbols-outlined">check_circle</span>
                Report sent successfully!
              </div>
            ) : (
              <>
                <div className={styles.bugField}>
                  <label className={styles.bugLabel}>Subject</label>
                  <input
                    className={styles.bugInput}
                    type="text"
                    placeholder="Brief description of the bug..."
                    value={bugSubject}
                    onChange={(e) => setBugSubject(e.target.value)}
                    disabled={bugStatus === "sending"}
                  />
                </div>
                <div className={styles.bugField}>
                  <label className={styles.bugLabel}>Details</label>
                  <textarea
                    className={styles.bugTextarea}
                    placeholder="What happened? What did you expect? Steps to reproduce..."
                    rows={5}
                    value={bugContent}
                    onChange={(e) => setBugContent(e.target.value)}
                    disabled={bugStatus === "sending"}
                  />
                </div>
                {bugStatus === "error" && (
                  <p className={styles.bugError}>Failed to send. Please try again.</p>
                )}
                <div className={styles.bugActions}>
                  <button className={styles.bugCancelBtn} onClick={() => setBugReportOpen(false)}>
                    Cancel
                  </button>
                  <button
                    className={styles.bugSubmitBtn}
                    onClick={handleSendBugReport}
                    disabled={bugStatus === "sending" || !bugSubject.trim() || !bugContent.trim()}
                  >
                    {bugStatus === "sending" ? (
                      <>
                        <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite" }}>progress_activity</span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">send</span>
                        Send Report
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* WISHLIST POPUP */}
      {wishlistOpen && <WishlistPopup onClose={() => setWishlistOpen(false)} />}
    </div>
  );
}

export default DashboardLayout;
