import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types/chat";
import Spinner from "../../components/Spinner";
import { PRODUCT_SAVED_EVENT } from "../../layouts/DashboardLayout";
import { OPEN_EDIT_PRODUCT_MODAL_EVENT } from "./ArtisanDashboard";
import styles from "./Dashboard.module.css";
import pageStyles from "./Courses.module.css";

interface ProductRatingSummary {
  product_id: string;
  avg_rating: number;
  total_ratings: number;
}

function MyProducts() {
  const navigate = useNavigate();
  const [artisanId, setArtisanId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<string, ProductRatingSummary>>({});
  const [loading, setLoading] = useState(true);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchProducts(uid: string) {
    setLoading(true);
    const [{ data }, { data: ratingsData }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("artisan_id", uid)
        .order("created_at", { ascending: false }),
      supabase.from("product_avg_ratings").select("*"),
    ]);
    setProducts((data as Product[]) ?? []);
    if (ratingsData) {
      const map: Record<string, ProductRatingSummary> = {};
      (ratingsData as ProductRatingSummary[]).forEach((r) => { map[r.product_id] = r; });
      setRatingsMap(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setArtisanId(data.session.user.id);
        fetchProducts(data.session.user.id);
      }
    });

    function handleProductSaved() {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) fetchProducts(data.session.user.id);
      });
    }
    window.addEventListener(PRODUCT_SAVED_EVENT, handleProductSaved);
    return () => window.removeEventListener(PRODUCT_SAVED_EVENT, handleProductSaved);
  }, []);

  function handleEdit(product: Product) {
    window.dispatchEvent(
      new CustomEvent(OPEN_EDIT_PRODUCT_MODAL_EVENT, { detail: { product } }),
    );
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
    if (artisanId) fetchProducts(artisanId);
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.grainOverlay}></div>
      <div className={pageStyles.contentWrap} style={{ gap: "2rem" }}>

        {loading ? (
          <Spinner size="lg" label="Loading your products..." />
        ) : products.length === 0 ? (
          <p style={{ color: "var(--outline)", textAlign: "center", padding: "4rem" }}>
            No products yet. Use "New Collection" to add one.
          </p>
        ) : (
          <div className={styles.productsGrid} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
            {products.map((p) => {
              const rating = ratingsMap[p.id];
              return (
                <div
                  key={p.id}
                  className={styles.productMiniCard}
                  onClick={() => navigate(`/dashboard/products/${p.id}`)}
                >
                  <div className={styles.productMiniThumb} style={{ height: "220px" }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className={styles.productMiniImg} />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--outline-variant)" }}>image</span>
                    )}
                  </div>
                  <div className={styles.productMiniBody}>
                    <p className={styles.productMiniName}>{p.name}</p>
                    <p className={styles.productMiniStock}>{p.is_available ? "In Stock" : "Out of Stock"}</p>
                    <p className={styles.productMiniPrice}>₹{p.price}</p>
                    {rating && rating.total_ratings > 0 && (
                      <div className={styles.productMiniRating}>
                        <span className="material-symbols-outlined" style={{ fontSize: "0.85rem", color: "var(--secondary)" }}>star</span>
                        <span>{Number(rating.avg_rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.productMiniActions}>
                    <button
                      className={styles.productMiniEdit}
                      onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                      title="Edit"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>edit</span>
                    </button>
                    <button
                      className={styles.productMiniDelete}
                      onClick={(e) => { e.stopPropagation(); setProductToDelete(p); }}
                      title="Delete"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
    </div>
  );
}

export default MyProducts;
