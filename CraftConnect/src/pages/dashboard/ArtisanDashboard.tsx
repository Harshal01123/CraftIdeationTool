import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Product, Purchase } from "../../types/chat";
import ProductCard from "../../components/products/ProductCard";
import Spinner from "../../components/Spinner";
import styles from "./Dashboard.module.css";
import { PRODUCT_SAVED_EVENT } from "../../layouts/DashboardLayout";

interface ProductRatingSummary {
  product_id: string;
  avg_rating: number;
  total_ratings: number;
}

export const OPEN_EDIT_PRODUCT_MODAL_EVENT =
  "dashboard:open-edit-product-modal";

function ArtisanDashboard({ artisanId }: { artisanId: string }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
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

  async function fetchUnreadCount() {
    const { data: unreadData } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", artisanId)
      .eq("is_read", false);
    setUnreadCount(unreadData?.length ?? 0);
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
        {
          event: "*",
          schema: "public",
          table: "purchases",
          filter: `artisan_id=eq.${artisanId}`,
        },
        () => fetchSales(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${artisanId}`,
        },
        () => fetchUnreadCount(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artisanId]);

  // Listen for "Product Saved" event from DashboardLayout
  useEffect(() => {
    function handleProductSaved() {
      fetchProducts();
    }
    window.addEventListener(PRODUCT_SAVED_EVENT, handleProductSaved);
    return () => {
      window.removeEventListener(PRODUCT_SAVED_EVENT, handleProductSaved);
    };
  }, []);

  function handleDeleteRequest(product: Product) {
    setProductToDelete(product);
  }

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

  const activeOrders = sales.filter((s) => s.status !== "completed").length;

  return (
    <section className={styles.hero}>
      <header className={styles.header}>
        <div className={styles.headerLeft}></div>
      </header>

      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <span className={styles.workspaceTag}>Artisan Workspace</span>
          <h3 className={styles.welcomeName}>
            Namaste, {profile?.name?.split(" ")[0] || "Artisan"}
          </h3>
          <p className={styles.welcomeText}>
            Your craft is the heartbeat of our heritage. Today, collectors are
            eagerly waiting for your new collections.
          </p>
        </div>
        <div className={styles.welcomeIcon}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "inherit" }}
          >
            brush
          </span>
        </div>
        <div className={styles.welcomePattern}></div>
      </div>

      {/* Stats KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>
                shopping_bag
              </span>
            </div>
          </div>
          <p className={styles.kpiValue}>{activeOrders}</p>
          <p className={styles.kpiLabel}>Active Orders</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>
                storefront
              </span>
            </div>
          </div>
          <p className={styles.kpiValue}>{products.length}</p>
          <p className={styles.kpiLabel}>Total Products</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>
                group
              </span>
            </div>
          </div>
          <p className={styles.kpiValue}>{sales.length}</p>
          <p className={styles.kpiLabel}>All-time Sales</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>
                chat_bubble
              </span>
            </div>
          </div>
          <p className={styles.kpiValue}>{unreadCount}</p>
          <p className={styles.kpiLabel}>Unread Messages</p>
        </div>
      </div>

      <div className={styles.middleSection}>
        <div style={{ gridColumn: "1 / -1" }}>
          {/* Sales History */}
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Recent Orders</h4>
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
                              <img
                                src={sale.product.image_url}
                                alt=""
                                className={styles.tableProductImg}
                              />
                            ) : (
                              <div
                                style={{
                                  background: "#e0e0e0",
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: "4px",
                                }}
                              ></div>
                            )}
                          </div>
                          <div>
                            <span className={styles.productName}>
                              {sale.product?.name || "Unknown Product"}
                            </span>
                            <div style={{ fontSize: "10px", color: "gray" }}>
                              {new Date(sale.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.customerName}>
                        {sale.customer?.name || "Unknown Customer"}
                      </td>
                      <td>
                        <span
                          className={
                            sale.status === "completed"
                              ? styles.statusCompleted
                              : styles.statusPending
                          }
                        >
                          {sale.status === "completed"
                            ? "Completed"
                            : "Processing"}
                        </span>
                      </td>
                      <td>
                        {sale.conversation_id ? (
                          <Link
                            to={`/dashboard/messages?conversation=${sale.conversation_id}`}
                            className={styles.chatLink}
                          >
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

      {/* My Products */}
      <div>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>My Products</h2>
        </div>

        {loading ? (
          <Spinner label="Loading products..." />
        ) : products.length === 0 ? (
          <p className={styles.empty}>
            You haven't added any products yet. Use "New Collection" in the
            sidebar to get started.
          </p>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((p) => {
              const rating = ratingsMap[p.id];
              return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={`₹${p.price}`}
                  description={p.description ?? ""}
                  imageUrl={p.image_url}
                  avgRating={rating ? Number(rating.avg_rating) : 0}
                  totalRatings={rating ? Number(rating.total_ratings) : 0}
                  onEdit={() => handleEdit(p)}
                  onDelete={() => handleDeleteRequest(p)}
                  onView={() => navigate(`/dashboard/products/${p.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div
          className={styles.popupOverlay}
          onClick={() => !isDeleting && setProductToDelete(null)}
        >
          <div
            className={styles.popupCard}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "3.5rem", color: "#d32f2f" }}
            >
              warning
            </span>
            <h3>Delete Product?</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{productToDelete.name}</strong>? This action cannot be
              undone and will permanently remove it from your shop.
            </p>
            <div className={styles.popupActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
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
