import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "react-i18next";
import { useWishlist } from "../../hooks/useWishlist";
import { useAuth } from "../../hooks/useAuth";
import type { Product } from "../../types/chat";
import ProductCard from "./ProductCard";
import Spinner from "../Spinner";
import styles from "./WishlistPopup.module.css";
import { useMode } from "../../contexts/ModeContext";
import OfferFlowCoordinator from "../chat/OfferFlowCoordinator";

function WishlistPopup({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setActiveMode } = useMode();
  const { profile } = useAuth();
  const { wishlistIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showOffer, setShowOffer] = useState(false);

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

      setProducts((data as Product[]) || []);
      setLoading(false);
    }
    fetchProducts();
  }, [wishlistIds]);

  function handleBuy(product: Product) {
    setSelectedProduct(product);
    setShowOffer(true);
  }

  function handleConversationStarted(conversationId: string) {
    setShowOffer(false);
    onClose();
    setActiveMode("customer");
    navigate(`/dashboard/messages?conversation=${conversationId}`);
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: "#d32f2f" }}>favorite</span>
              {t("extended.myWishlist")}
            </h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className={styles.content}>
            {loading ? (
               <Spinner label={t("extended.loadingWishlist")} />
            ) : products.length === 0 ? (
              <div className={styles.empty}>
                <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--outline)", opacity: 0.5 }}>heart_broken</span>
                <p>{t("extended.emptyWishlist")}</p>
                <button className={styles.exploreBtn} onClick={() => { onClose(); setActiveMode("customer"); navigate("/dashboard/products"); }}>Explore Products</button>
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
                    onView={() => {
                      onClose();
                      navigate(`/dashboard/products/${p.id}`);
                    }}
                    onBuy={
                      profile?.id !== p.artisan_id
                        ? () => handleBuy(p)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <OfferFlowCoordinator
        isOpen={showOffer && selectedProduct !== null}
        onClose={() => setShowOffer(false)}
        artisan={selectedProduct?.artisan as any}
        product={selectedProduct}
        onConversationStarted={handleConversationStarted}
      />
    </>
  );
}

export default WishlistPopup;
