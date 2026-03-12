import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types/chat";
import ProductCard from "../../components/products/ProductCard";
import AddProductModal from "../../components/products/AddProductModal";
import styles from "./Dashboard.module.css";

function ArtisanDashboard({ artisanId }: { artisanId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchProducts();
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
      <div className={styles.artisanHeader}>
        <h2>My Products</h2>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          + Add Product
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading products...</p>
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

  if (authLoading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (profile?.role === "artisan")
    return <ArtisanDashboard artisanId={profile.id} />;
  return <LearnerDashboard />;
}

export default Dashboard;
