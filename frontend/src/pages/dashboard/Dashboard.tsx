import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Add Link
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Product, Purchase } from "../../types/chat"; // Import Purchase
import ProductCard from "../../components/products/ProductCard";
import AddProductModal from "../../components/products/AddProductModal";
import Spinner from "../../components/Spinner";
import CustomerDashboard from "./CustomerDashboard";
import styles from "./Dashboard.module.css";

function ArtisanDashboard({ artisanId }: { artisanId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
      // Explicitly hint the foreign key relationship for customer
      .select("*, customer:profiles!customer_id(*), product:products(*)")
      .eq("artisan_id", artisanId)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching sales:", error);
    setSales((data as Purchase[]) ?? []);
    setSalesLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, [artisanId]);

  useEffect(() => {
    fetchSales();

    const channel = supabase
      .channel(`artisan-sales-${artisanId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "purchases",
          filter: `artisan_id=eq.${artisanId}`,
        },
        () => {
          fetchSales();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "purchases",
          filter: `artisan_id=eq.${artisanId}`,
        },
        () => {
          fetchSales();
        },
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

  return (
    <section className={styles.hero}>
      {/* Products Section */}
      <div className={styles.artisanHeader}>
        <h2>My Products</h2>
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

      {/* Sales History Section */}
      <div className={styles.salesSection}>
        <h3 className={styles.sectionTitle}>Recent Orders</h3>
        {salesLoading ? (
          <Spinner label="Loading orders..." />
        ) : sales.length === 0 ? (
          <p className={styles.empty}>No orders yet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.salesTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                    <td>{sale.product?.name || "Unknown Product"}</td>
                    <td>{sale.customer?.name || "Unknown Customer"}</td>
                    <td>₹{sale.total_price}</td>
                    <td>
                      <span
                        className={
                          sale.status === "completed"
                            ? styles.statusCompleted
                            : styles.statusPending
                        }
                      >
                        {sale.status === "completed" ? "Completed" : "Pending"}
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
                  </tr>
                ))}
              </tbody>
            </table>
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
  return (
    <section className={styles.hero}>
      <h2>Overview</h2>
      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <h3>Certificates</h3>
          <p>0</p>
        </div>
        <div className={styles.card}>
          <h3>Enrolled Courses</h3>
          <p>0</p>
        </div>
        <div className={styles.card}>
          <h3>Completed Courses</h3>
          <p>0</p>
        </div>
        <div className={styles.card}>
          <h3>Streak</h3>
          <p>0 days</p>
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
