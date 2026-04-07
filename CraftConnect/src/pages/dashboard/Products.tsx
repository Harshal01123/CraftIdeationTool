import { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./Products.module.css";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useOutletContext } from "react-router-dom";
import ProductCard from "../../components/products/ProductCard";
import Spinner from "../../components/Spinner";
import OfferFlowCoordinator from "../../components/chat/OfferFlowCoordinator";
import { INDUSTRY_OPTIONS } from "../../constants/industryOptions";
import { useTranslation } from "react-i18next";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  artisan_id: string;
  category: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  artisan: { id: string; name: string; avatar_url: string | null };
}

interface ProductRatingSummary {
  product_id: string;
  avg_rating: number;
  total_ratings: number;
}

const PAGE_SIZE = 24;

function Products() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<string, ProductRatingSummary>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Filter state (local only for the dropdown/slider UI)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number>(10000);

  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ─── Fetch (server-side filtered, paginated) ───────────────────────────────
  const fetchProducts = useCallback(
    async (pageIndex: number, reset = false) => {
      if (reset) {
        setLoading(true);
        setProducts([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      let query = supabase
        .from("products")
        .select("*, artisan:profiles!artisan_id(id, name, avatar_url)")
        .eq("is_available", true)
        .order("created_at", { ascending: false })
        .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1);

      // Server-side filters
      if (selectedCategory) query = query.eq("category", selectedCategory);
      if (appliedMaxPrice < 10000) query = query.lte("price", appliedMaxPrice);
      if (searchQuery) query = query.ilike("name", `%${searchQuery}%`);
      // Exclude own products
      if (profile) query = query.neq("artisan_id", profile.id);

      const { data } = await query;
      const batch = (data ?? []) as Product[];

      setProducts((prev) => (reset ? batch : [...prev, ...batch]));
      setHasMore(batch.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [selectedCategory, appliedMaxPrice, searchQuery, profile]
  );

  // ─── Ratings (fetched once, all; it's a tiny view) ────────────────────────
  useEffect(() => {
    supabase.from("product_avg_ratings").select("*").then(({ data }) => {
      if (data) {
        const map: Record<string, ProductRatingSummary> = {};
        (data as ProductRatingSummary[]).forEach((r) => { map[r.product_id] = r; });
        setRatingsMap(map);
      }
    });
  }, []);

  // ─── Re-fetch when any filter changes ─────────────────────────────────────
  useEffect(() => {
    setPage(0);
    fetchProducts(0, true);
  }, [selectedCategory, appliedMaxPrice, searchQuery, profile]);

  // ─── Category counts from loaded products (cheap, local) ──────────────────
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    INDUSTRY_OPTIONS.forEach((opt) => (counts[opt] = 0));
    products.forEach((p) => {
      const cat = p.category?.trim() || "Uncategorized";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => {
      if (a[0] === "Other") return 1;
      if (b[0] === "Other") return -1;
      const aIsOpt = (INDUSTRY_OPTIONS as readonly string[]).includes(a[0]);
      const bIsOpt = (INDUSTRY_OPTIONS as readonly string[]).includes(b[0]);
      if (aIsOpt && !bIsOpt) return -1;
      if (!aIsOpt && bIsOpt) return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [products]);

  function handleBuyClick(product: Product) {
    if (!profile) return alert(t("extended.loginToPurchase"));
    setSelectedProduct(product);
    setShowDialog(true);
  }

  function handleConversationStarted(conversationId: string) {
    setShowDialog(false);
    navigate(`/dashboard/messages?conversation=${conversationId}`);
  }

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchProducts(next);
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
                <option value="">{t("extended.allCollections")}</option>
                {categories.map(([cat]) => (
                  <option key={cat} value={cat}>
                    {t(`industry.${cat}`, cat)}
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
          ) : products.length === 0 ? (
            <p className={styles.emptyText}>{t("extended.emptyProducts")}</p>
          ) : (
            <>
              <div className={styles.grid}>
                {products.map((p) => {
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
                      totalRatings={ratingInfo ? Number(ratingInfo.total_ratings) : 0}
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

              {/* Load More */}
              {hasMore && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{
                      padding: "0.75rem 2.5rem",
                      background: "transparent",
                      border: "1px solid var(--outline-variant)",
                      borderRadius: "10px",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-label)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      cursor: loadingMore ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                  >
                    {loadingMore ? (
                      <Spinner size="sm" inline />
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                          expand_more
                        </span>
                        {t("extended.loadMore", "Load More")}
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <OfferFlowCoordinator
        isOpen={showDialog && selectedProduct !== null}
        onClose={() => setShowDialog(false)}
        artisan={(selectedProduct?.artisan ?? null) as any}
        product={selectedProduct as any}
        onConversationStarted={handleConversationStarted}
      />
    </div>
  );
}

export default Products;
