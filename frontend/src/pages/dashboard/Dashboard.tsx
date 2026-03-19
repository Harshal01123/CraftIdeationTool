import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Product, Purchase } from "../../types/chat";
import ProductCard from "../../components/products/ProductCard";
import AddProductModal from "../../components/products/AddProductModal";
import Spinner from "../../components/Spinner";
import CustomerDashboard from "./CustomerDashboard";
import styles from "./Dashboard.module.css";

function ArtisanDashboard({ artisanId }: { artisanId: string }) {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Stats derived
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("artisan_id", artisanId)
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) ?? []);
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

  async function fetchUnreadCount() {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", artisanId)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }

  useEffect(() => {
    fetchProducts();
  }, [artisanId]);

  useEffect(() => {
    fetchSales();
    fetchUnreadCount();

    const channel = supabase
      .channel(`artisan-sales-dashboard-${artisanId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchases", filter: `artisan_id=eq.${artisanId}` },
        () => fetchSales(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${artisanId}` },
        () => fetchUnreadCount(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artisanId]);

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    if (product.image_url) {
      const path = product.image_url.split("/products/")[1];
      if (path) await supabase.storage.from("products").remove([path]);
    }

    await supabase.from("products").delete().eq("id", product.id);
    fetchProducts();
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setEditingProduct(null);
  }

  function handleSaved() {
    handleModalClose();
    fetchProducts();
  }

  const activeOrders = sales.filter(s => s.status !== "completed").length;

  return (
    <section className={styles.hero}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <span className={styles.workspaceTag}>Artisan Workspace</span>
          <h3 className={styles.welcomeName}>Namaste, {profile?.name?.split(" ")[0] || "Artisan"}</h3>
          <p className={styles.welcomeText}>Your craft is the heartbeat of our heritage. Today, collectors are eagerly waiting for your new collections.</p>
        </div>
        <div className={styles.welcomeIcon}>
          <span className="material-symbols-outlined" style={{fontSize: "inherit"}}>brush</span>
        </div>
        <div className={styles.welcomePattern}></div>
      </div>

      {/* Stats KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>shopping_bag</span>
            </div>
            <span className={`${styles.kpiBadge} ${styles.kpiBadgeSuccess}`}>+Live</span>
          </div>
          <p className={styles.kpiValue}>{activeOrders}</p>
          <p className={styles.kpiLabel}>Active Orders</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>storefront</span>
            </div>
            <span className={`${styles.kpiBadge} ${styles.kpiBadgeNeutral}`}>Catalog</span>
          </div>
          <p className={styles.kpiValue}>{products.length}</p>
          <p className={styles.kpiLabel}>Total Products</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>group</span>
            </div>
            <span className={`${styles.kpiBadge} ${styles.kpiBadgeNeutral}`}>Reach</span>
          </div>
          <p className={styles.kpiValue}>{sales.length}</p>
          <p className={styles.kpiLabel}>All-time Sales</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>chat_bubble</span>
            </div>
          </div>
          <p className={styles.kpiValue}>{unreadCount}</p>
          <p className={styles.kpiLabel}>Unread Messages</p>
        </div>
      </div>

      <div className={styles.middleSection}>
        <div style={{gridColumn: "1 / -1"}}>
          {/* Sales History Section matched with Stitch "Recent Heritage Orders" */}
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Recent Heritage Orders</h4>
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
                    <th>Artifact</th>
                    <th>Collector</th>
                    <th>Status</th>
                    <th>Action</th>
                    <th className={styles.amountHeader}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <div className={styles.tableProductInfo}>
                          <div className={styles.tableProductImgBox}>
                            {sale.product?.image_url ? (
                              <img src={sale.product.image_url} alt="" className={styles.tableProductImg} />
                            ) : (
                              <div style={{background: '#e0e0e0', width: '100%', height:'100%', borderRadius: '4px'}}></div>
                            )}
                          </div>
                          <div>
                            <span className={styles.productName}>{sale.product?.name || "Unknown Product"}</span>
                            <div style={{fontSize: '10px', color: 'gray'}}>{new Date(sale.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.customerName}>{sale.customer?.name || "Unknown Customer"}</td>
                      <td>
                        <span className={sale.status === "completed" ? styles.statusCompleted : styles.statusPending}>
                          {sale.status === "completed" ? "Completed" : "Processing"}
                        </span>
                      </td>
                      <td>
                        {sale.conversation_id ? (
                          <Link to={`/dashboard/messages?conversation=${sale.conversation_id}`} className={styles.chatLink}>
                            Open Chat
                          </Link>
                        ) : (
                          <span className={styles.disabledLink}>-</span>
                        )}
                      </td>
                      <td className={styles.amount}>₹{sale.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className={styles.artisanHeader}>
          <h2 className={styles.sectionTitle}>My Products</h2>
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            + Add Product
          </button>
        </div>

        {loading ? (
          <Spinner label="Loading products..." />
        ) : products.length === 0 ? (
          <p className={styles.empty}>You haven't added any products yet.</p>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                price={`₹${p.price}`}
                description={p.description ?? ""}
                imageUrl={p.image_url}
                onEdit={() => handleEdit(p)}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddProductModal
          artisanId={artisanId}
          existingProduct={editingProduct}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}

function LearnerDashboard() {
  const { profile } = useAuth();
  return (
    <section className={styles.hero}>
      <div className={styles.welcomeBanner} style={{backgroundColor: "var(--tertiary)"}}>
        <div className={styles.welcomeContent}>
          <span className={styles.workspaceTag}>Learner Workspace</span>
          <h3 className={styles.welcomeName}>Namaste, {profile?.name?.split(" ")[0] || "Learner"}</h3>
          <p className={styles.welcomeText}>Continue your journey through India's rich cultural heritage.</p>
        </div>
        <div className={styles.welcomeIcon}>
          <span className="material-symbols-outlined" style={{fontSize: "inherit"}}>school</span>
        </div>
      </div>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>verified</span>
            </div>
          </div>
          <p className={styles.kpiValue}>0</p>
          <p className={styles.kpiLabel}>Certificates</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>menu_book</span>
            </div>
          </div>
          <p className={styles.kpiValue}>0</p>
          <p className={styles.kpiLabel}>Enrolled Courses</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>done_all</span>
            </div>
          </div>
          <p className={styles.kpiValue}>0</p>
          <p className={styles.kpiLabel}>Completed Courses</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>local_fire_department</span>
            </div>
          </div>
          <p className={styles.kpiValue}>0</p>
          <p className={styles.kpiLabel}>Streak Days</p>
        </div>
      </div>
    </section>
  );
}

function Dashboard() {
  const { profile, authLoading } = useAuth();

  if (authLoading)
    return (
      <div style={{ padding: "2rem" }}>
        <Spinner label="Loading..." />
      </div>
    );
  if (profile?.role === "artisan")
    return <ArtisanDashboard artisanId={profile.id} />;
  if (profile?.role === "customer")
    return <CustomerDashboard customerId={profile.id} />;
  return <LearnerDashboard />;
}

export default Dashboard;
