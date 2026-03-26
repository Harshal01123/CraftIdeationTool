import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useWishlist } from "../../hooks/useWishlist";
import type { Product } from "../../types/chat";
import ProductCard from "./ProductCard";
import Spinner from "../Spinner";
import styles from "./WishlistPopup.module.css";

function WishlistPopup({ onClose }: { onClose: () => void }) {
  const { wishlistIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (wishlistIds.size === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from("products")
        .select("*, artisan:profiles!artisan_id(*)")
        .in("id", Array.from(wishlistIds));

      // We preserve the local product array length but sync with context.
      // If a user un-hearts a product from the modal, we can either immediately remove it,
      // or only remove it if `wishlistIds` doesn't contain it. Actually `in` query handles it, 
      // but to prevent layout jumping when they click the heart, we just re-fetch here which 
      // naturally removes it, or we could filter locally. Re-fetching provides source-of-truth.
      setProducts((data as Product[]) || []);
      setLoading(false);
    }
    fetchProducts();
  }, [wishlistIds]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: "#d32f2f" }}>favorite</span>
            My Wishlist
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
             <Spinner label="Loading wishlist..." />
          ) : products.length === 0 ? (
            <div className={styles.empty}>
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--outline)", opacity: 0.5 }}>heart_broken</span>
              <p>Your wishlist is empty.</p>
              <button className={styles.exploreBtn} onClick={onClose}>Explore Products</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={`₹${p.price}`}
                  description={p.description ?? ""}
                  artisanName={p.artisan?.name}
                  imageUrl={p.image_url}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WishlistPopup;
