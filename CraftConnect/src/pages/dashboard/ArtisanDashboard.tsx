import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Product, Purchase } from "../../types/chat";
import Spinner from "../../components/Spinner";
import styles from "./Dashboard.module.css";
import { PRODUCT_SAVED_EVENT, COURSE_SAVED_EVENT } from "../../layouts/DashboardLayout";

interface ProductRatingSummary {
  product_id: string;
  avg_rating: number;
  total_ratings: number;
}

interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  description?: string;
  thumbnail: string | null;
  duration_minutes: number;
  videos: { title: string; duration_minutes: number }[];
}

export const OPEN_EDIT_PRODUCT_MODAL_EVENT =
  "dashboard:open-edit-product-modal";

function ArtisanDashboard({ artisanId }: { artisanId: string }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Purchase[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [ratingsMap, setRatingsMap] = useState<
    Record<string, ProductRatingSummary>
  >({});

  // Deletion modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchProducts() {
    const [{ data }, { data: ratingsData }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("artisan_id", artisanId)
        .order("created_at", { ascending: false }),
      supabase.from("product_avg_ratings").select("*"),
    ]);
    setProducts((data as Product[]) ?? []);
    if (ratingsData) {
      const map: Record<string, ProductRatingSummary> = {};
      (ratingsData as ProductRatingSummary[]).forEach((r) => {
        map[r.product_id] = r;
      });
      setRatingsMap(map);
    }
    setLoading(false);
  }

  async function fetchSales() {
    const { data, error } = await supabase
      .from("purchases")
      .select("*, customer:profiles!customer_id(*), product:products(*)")
      .eq("artisan_id", artisanId)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching sales:", error);
    setSales((data as Purchase[]) ?? []);
    setSalesLoading(false);
  }

  async function fetchCourses() {
    setCoursesLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, category, level, thumbnail, duration_minutes, videos")
      .eq("artisan_id", artisanId)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching courses:", error);
    setCourses((data as Course[]) ?? []);
    setCoursesLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, [artisanId]);

  useEffect(() => {
    fetchSales();
    fetchCourses();

    const channel = supabase
      .channel(`artisan-sales-dashboard-${artisanId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchases", filter: `artisan_id=eq.${artisanId}` },
        () => fetchSales(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [artisanId]);

  useEffect(() => {
    function handleProductSaved() { fetchProducts(); }
    function handleCourseSaved() { fetchCourses(); }
    window.addEventListener(PRODUCT_SAVED_EVENT, handleProductSaved);
    window.addEventListener(COURSE_SAVED_EVENT, handleCourseSaved);
    return () => {
      window.removeEventListener(PRODUCT_SAVED_EVENT, handleProductSaved);
      window.removeEventListener(COURSE_SAVED_EVENT, handleCourseSaved);
    };
  }, []);

  function handleDeleteRequest(product: Product) { setProductToDelete(product); }

  async function confirmDelete() {
    if (!productToDelete) return;
    setIsDeleting(true);
    if (productToDelete.image_url) {
      const path = productToDelete.image_url.split("/products/")[1];
      if (path) await supabase.storage.from("products").remove([path]);
    }
    await supabase.from("products").delete().eq("id", productToDelete.id);
    setProductToDelete(null);
    setIsDeleting(false);
    fetchProducts();
  }

  function handleEdit(product: Product) {
    window.dispatchEvent(
      new CustomEvent(OPEN_EDIT_PRODUCT_MODAL_EVENT, { detail: { product } }),
    );
  }

  // Computed KPIs
  const activeOrders = sales.filter((s) => s.status !== "completed").length;
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const totalStudents = courses.reduce((sum, c) => sum + (c.videos?.length || 0), 0);
  const artisanRatings = products.map((p) => ratingsMap[p.id]).filter(Boolean).filter((r) => r.total_ratings > 0);
  const storeRating =
    artisanRatings.length > 0
      ? (artisanRatings.reduce((s, r) => s + Number(r.avg_rating), 0) / artisanRatings.length).toFixed(1)
      : "—";

  const formatRevenue = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  };

  const getStatusClass = (status: string) => {
    if (status === "completed") return styles.statusDelivered;
    if (status === "shipped") return styles.statusShipped;
    return styles.statusProcessing;
  };

  const getStatusLabel = (status: string) => {
    if (status === "completed") return "Delivered";
    if (status === "shipped") return "Shipped";
    return "Processing";
  };

  return (
    <section className={styles.hero}>

      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <span className={styles.workspaceTag}>Artisan Workspace</span>
          <h2 className={styles.welcomeName}>
            Namaste, {profile?.name?.split(" ")[0] || "Artisan"}
          </h2>
          <p className={styles.welcomeText}>
            Your curation has seen increased interest this week. Launch your new collections today.
          </p>
          <button className={styles.viewAnalyticsBtn} onClick={() => navigate("/dashboard/courses")}>
            View Analytics
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>arrow_forward</span>
          </button>
        </div>
        <div className={styles.welcomePattern}></div>
        <div className={styles.welcomeIcon}>
          <span className="material-symbols-outlined" style={{ fontSize: "inherit" }}>brush</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>account_balance_wallet</span>
            </div>
            <span className={`${styles.kpiBadge} ${styles.kpiBadgeSuccess}`}>+12%</span>
          </div>
          <p className={styles.kpiValue}>{formatRevenue(totalRevenue)}</p>
          <p className={styles.kpiLabel}>Total Revenue</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>assignment</span>
            </div>
            <span className={`${styles.kpiBadge} ${styles.kpiBadgeSuccess}`}>+5%</span>
          </div>
          <p className={styles.kpiValue}>{activeOrders}</p>
          <p className={styles.kpiLabel}>Orders Generated</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>school</span>
            </div>
            <span className={`${styles.kpiBadge} ${styles.kpiBadgeSuccess}`}>+{totalStudents}</span>
          </div>
          <p className={styles.kpiValue}>{courses.length}</p>
          <p className={styles.kpiLabel}>My Courses</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>star</span>
            </div>
            <span className={`${styles.kpiBadge} ${storeRating !== "—" ? styles.kpiBadgeSuccess : styles.kpiBadgeNeutral}`}>
              {storeRating !== "—" ? "Top 1%" : "—"}
            </span>
          </div>
          <p className={styles.kpiValue}>{storeRating}{storeRating !== "—" && <span className={styles.kpiValueSub}>/5</span>}</p>
          <p className={styles.kpiLabel}>Store Rating</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Orders</h3>
          <Link to="/dashboard/messages" className={styles.viewAllBtn}>View All Orders</Link>
        </div>
        {salesLoading ? (
          <Spinner label="Loading orders..." />
        ) : sales.length === 0 ? (
          <p className={styles.empty}>No orders yet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.salesTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className={styles.amountHeader}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id}>
                    <td className={styles.orderId}>#{sale.id.slice(0, 8).toUpperCase()}</td>
                    <td>
                      <div className={styles.tableProductInfo}>
                        <div className={styles.tableProductImgBox}>
                          {sale.product?.image_url ? (
                            <img src={sale.product.image_url} alt="" className={styles.tableProductImg} />
                          ) : (
                            <div style={{ background: "var(--surface-container-high)", width: "100%", height: "100%", borderRadius: "4px" }}></div>
                          )}
                        </div>
                        <span className={styles.productName}>{sale.product?.name || "Unknown Product"}</span>
                      </div>
                    </td>
                    <td className={styles.customerName}>{sale.customer?.name || "Unknown"}</td>
                    <td className={styles.orderDate}>{new Date(sale.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td>
                      <span className={getStatusClass(sale.status)}>{getStatusLabel(sale.status)}</span>
                    </td>
                    <td className={styles.amount}>₹{sale.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom: Products + Courses side by side */}
      <div className={styles.bottomGrid}>
        {/* My Products */}
        <div>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>My Products</h3>
            <button className={styles.viewAllBtn} onClick={() => navigate("/dashboard/products")}>View All</button>
          </div>
          {loading ? (
            <Spinner label="Loading products..." />
          ) : products.length === 0 ? (
            <p className={styles.empty}>No products yet. Use "New Collection" to add one.</p>
          ) : (
            <div className={styles.productsGrid}>
              {products.slice(0, 4).map((p) => {
                const rating = ratingsMap[p.id];
                return (
                  <div key={p.id} className={styles.productMiniCard} onClick={() => navigate(`/dashboard/products/${p.id}`)}>
                    <div className={styles.productMiniThumb}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className={styles.productMiniImg} />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--outline-variant)" }}>image</span>
                      )}
                    </div>
                    <div className={styles.productMiniBody}>
                      <p className={styles.productMiniName}>{p.name}</p>
                      <p className={styles.productMiniStock}>
                        {p.is_available ? "In Stock" : "Out of Stock"}
                      </p>
                      <p className={styles.productMiniPrice}>₹{p.price}</p>
                      {rating && rating.total_ratings > 0 && (
                        <div className={styles.productMiniRating}>
                          <span className="material-symbols-outlined" style={{ fontSize: "0.85rem", color: "var(--secondary)" }}>star</span>
                          <span>{Number(rating.avg_rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.productMiniActions}>
                      <button className={styles.productMiniEdit} onClick={(e) => { e.stopPropagation(); handleEdit(p); }} title="Edit">
                        <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>edit</span>
                      </button>
                      <button className={styles.productMiniDelete} onClick={(e) => { e.stopPropagation(); handleDeleteRequest(p); }} title="Delete">
                        <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Courses */}
        <div>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>My Courses</h3>
            <button className={styles.viewAllBtn} onClick={() => navigate("/dashboard/courses")}>View All</button>
          </div>
          {coursesLoading ? (
            <Spinner label="Loading courses..." />
          ) : courses.length === 0 ? (
            <p className={styles.empty}>No courses yet. Use "New Course" to create one.</p>
          ) : (
            <div className={styles.coursesList}>
              {courses.slice(0, 4).map((c) => (
                <div key={c.id} className={styles.courseListItem} onClick={() => navigate(`/dashboard/courses/${c.id}`)}>
                  <div className={styles.courseListThumb}>
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.title} className={styles.courseListImg} />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: "1.5rem", color: "var(--outline-variant)" }}>play_circle</span>
                    )}
                  </div>
                  <div className={styles.courseListBody}>
                    <p className={styles.courseListTitle}>{c.title}</p>
                    {c.description && <p className={styles.courseListDesc}>{c.description}</p>}
                    <div className={styles.courseListMeta}>
                      <span className={styles.courseListLevel}>{c.level}</span>
                      {c.videos && c.videos.length > 0 && (
                        <span className={styles.courseListVideos}>{c.videos.length} video{c.videos.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className={styles.popupOverlay} onClick={() => !isDeleting && setProductToDelete(null)}>
          <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined" style={{ fontSize: "3.5rem", color: "#d32f2f" }}>warning</span>
            <h3>Delete Product?</h3>
            <p>
              Are you sure you want to delete <strong>{productToDelete.name}</strong>?
              This action cannot be undone.
            </p>
            <div className={styles.popupActions}>
              <button className={styles.cancelBtn} onClick={() => setProductToDelete(null)} disabled={isDeleting}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? <Spinner size="sm" inline /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ArtisanDashboard;
