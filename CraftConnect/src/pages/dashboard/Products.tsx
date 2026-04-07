import { useEffect, useState, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types/chat";
import ProductCard from "../../components/products/ProductCard";
import Spinner from "../../components/Spinner";
import OfferFlowCoordinator from "../../components/chat/OfferFlowCoordinator";
import styles from "./Products.module.css";
import { useAuth } from "../../hooks/useAuth";
import { INDUSTRY_OPTIONS } from "../../constants/industryOptions";

interface ProductRatingSummary {
  product_id: string;
  avg_rating: number;
  total_ratings: number;
}

function Products() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingsMap, setRatingsMap] = useState<
    Record<string, ProductRatingSummary>
  >({});

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number>(10000);
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      const [{ data: productsData }, { data: ratingsData }] = await Promise.all(
        [
          supabase
            .from("products")
            .select("*, artisan:profiles!artisan_id(id, name, avatar_url)")
            .eq("is_available", true)
            .order("created_at", { ascending: false }),
          supabase.from("product_avg_ratings").select("*"),
        ],
      );

      if (productsData) setProducts(productsData as Product[]);

      if (ratingsData) {
        const map: Record<string, ProductRatingSummary> = {};
        (ratingsData as ProductRatingSummary[]).forEach((r) => {
          map[r.product_id] = r;
        });
        setRatingsMap(map);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const displayableProducts = useMemo(() => {
    if (!profile) return products;
    return products.filter((p) => p.artisan_id !== profile.id);
  }, [products, profile]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    INDUSTRY_OPTIONS.forEach((opt) => (counts[opt] = 0));
    displayableProducts.forEach((p) => {
      const cat = p.category?.trim() || "Uncategorized";
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts[cat] = 1;
      }
    });
    // Sort so INDUSTRY_OPTIONS come first (sorted alphabetically), followed by others
    return Object.entries(counts).sort((a, b) => {
      // "Other" always goes last
      if (a[0] === "Other") return 1;
      if (b[0] === "Other") return -1;
      const aIsOpt = (INDUSTRY_OPTIONS as readonly string[]).includes(a[0]);
      const bIsOpt = (INDUSTRY_OPTIONS as readonly string[]).includes(b[0]);
      if (aIsOpt && !bIsOpt) return -1;
      if (!aIsOpt && bIsOpt) return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [displayableProducts]);

  const filteredProducts = useMemo(() => {
    return displayableProducts.filter((p) => {
      if (
        selectedCategory &&
        (p.category?.trim() || "Uncategorized") !== selectedCategory
      )
        return false;
      if (p.price > appliedMaxPrice) return false;
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [displayableProducts, selectedCategory, searchQuery, appliedMaxPrice]);

  function handleBuyClick(product: Product) {
    if (!profile) return alert(t("extended.loginToPurchase"));

    setSelectedProduct(product);
    setShowDialog(true);
  }

  function handleConversationStarted(conversationId: string) {
    setShowDialog(false);
    navigate(`/dashboard/messages?conversation=${conversationId}`);
  }

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroBanner}>
          <div className={styles.heroContent}>
            <span className={styles.heroHindi}>विरासत</span>
            <h2 className={styles.heroTitle}>{t("extended.handpickedCollection")}</h2>
            <p className={styles.heroDesc}>
              {t("extended.discoverRareArtifacts")}
            </p>
          </div>
        </div>
      </section>

      <div className={styles.mainLayout}>
        {/* ── Top Filter Bar ── */}
        <div className={styles.topFilterBar}>
          {/* Category Dropdown */}
          <div className={styles.topFilterGroup}>
            <span className={styles.topFilterLabel}>{t("extended.categories")}</span>
            <div style={{ position: "relative" }}>
              <select
                value={selectedCategory ?? ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className={styles.topSelect}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--outline-variant)")}
              >
                <option value="">{t("extended.allCollections")} ({products.length})</option>
                {categories.map(([cat, count]) => (
                  <option key={cat} value={cat}>
                    {t(`industry.${cat}`, cat)} ({count})
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined"
                style={{
                  position: "absolute",
                  right: "0.6rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "1.1rem",
                  color: "var(--on-surface-variant)",
                  pointerEvents: "none",
                }}
              >
                expand_more
              </span>
            </div>
          </div>

          {/* Price Range */}
          <div className={styles.topFilterGroup} style={{ flex: 1, maxWidth: "320px" }}>
            <span className={styles.topFilterLabel}>
              {t("extended.maxPrice")}:&nbsp;
              <strong style={{ color: "var(--primary)" }}>
                ₹{maxPrice >= 10000 ? "10,000+" : maxPrice.toLocaleString("en-IN")}
              </strong>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ flex: 1, cursor: "pointer", accentColor: "var(--primary)" }}
              />
              <button
                onClick={() => setAppliedMaxPrice(maxPrice)}
                className={styles.applyBtn}
              >
                {t("extended.applyFilter")}
              </button>
            </div>
          </div>
        </div>

        {/* ── Full-width Product Grid ── */}
        <div className={styles.contentArea}>
          {loading ? (
            <div className={styles.loader}>
              <Spinner label={t("extended.loadingProducts")} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className={styles.emptyText}>{t("extended.emptyProducts")}</p>
          ) : (
            <div className={styles.grid}>
              {filteredProducts.map((p) => {
                const ratingInfo = ratingsMap[p.id];
                return (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={`₹${p.price}`}
                    description={p.description ?? ""}
                    artisanName={p.artisan?.name}
                    imageUrl={p.image_url}
                    avgRating={ratingInfo ? Number(ratingInfo.avg_rating) : 0}
                    totalRatings={
                      ratingInfo ? Number(ratingInfo.total_ratings) : 0
                    }
                    onView={() => navigate(`/dashboard/products/${p.id}`)}
                    onBuy={
                      profile?.id !== p.artisan_id
                        ? () => handleBuyClick(p)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <OfferFlowCoordinator
        isOpen={showDialog && selectedProduct !== null}
        onClose={() => setShowDialog(false)}
        artisan={selectedProduct?.artisan as any}
        product={selectedProduct}
        onConversationStarted={handleConversationStarted}
      />
    </div>
  );
}

export default Products;
