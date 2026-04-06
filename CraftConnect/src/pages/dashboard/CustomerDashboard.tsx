import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Purchase } from "../../types/chat";
import Spinner from "../../components/Spinner";
import styles from "./Dashboard.module.css";
import RatingModal from "../../components/ratings/RatingModal";

function CustomerDashboard({ customerId }: { customerId: string }) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ratedArtisans, setRatedArtisans] = useState<Set<string>>(new Set());
  const [ratedProducts, setRatedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Rating Modal State
  const [ratingTarget, setRatingTarget] = useState<{
    type: "artisan" | "product";
    id: string;
    name: string;
    image?: string;
  } | null>(null);
  const [ratingProcessing, setRatingProcessing] = useState(false);

  async function fetchPurchasesAndRatings() {
    const [purchasesRes, artisanRatingsRes, productRatingsRes] = await Promise.all([
      supabase
        .from("purchases")
        .select("*, product:products(*), artisan:profiles!artisan_id(*)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase.from("artisan_ratings").select("artisan_id").eq("reviewer_id", customerId),
      supabase.from("product_ratings").select("product_id").eq("reviewer_id", customerId),
    ]);

    setPurchases((purchasesRes.data as Purchase[]) ?? []);
    if (artisanRatingsRes.data) {
      setRatedArtisans(new Set(artisanRatingsRes.data.map((r) => r.artisan_id)));
    }
    if (productRatingsRes.data) {
      setRatedProducts(new Set(productRatingsRes.data.map((r) => r.product_id)));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPurchasesAndRatings();

    const channel = supabase
      .channel(`customer-purchases-${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "purchases",
          filter: `customer_id=eq.${customerId}`,
        },
        () => fetchPurchasesAndRatings(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId]);

  const totalOrders = purchases.length;
  const totalSpent = purchases.reduce(
    (sum, p) => sum + Number(p.total_price),
    0,
  );

  const pendingReviews = useMemo(() => {
    const pending: Array<{ type: "artisan" | "product"; id: string; name: string; image?: string }> = [];
    const seenArtisans = new Set<string>();
    const seenProducts = new Set<string>();

    purchases.forEach((p) => {
      // Artisan Review
      if (p.artisan_id && !ratedArtisans.has(p.artisan_id) && !seenArtisans.has(p.artisan_id)) {
        seenArtisans.add(p.artisan_id);
        const artisanData = (p as any).artisan;
        const artisanName = artisanData?.name || "Artisan";
        pending.push({ type: "artisan", id: p.artisan_id, name: artisanName, image: artisanData?.avatar_url });
      }

      // Product Review
      if (p.product_id && !ratedProducts.has(p.product_id) && !seenProducts.has(p.product_id) && p.product) {
        seenProducts.add(p.product_id);
        pending.push({ type: "product", id: p.product_id, name: p.product.name, image: p.product.image_url ?? undefined });
      }
    });

    return pending;
  }, [purchases, ratedArtisans, ratedProducts]);

  async function handleSubmitRating(rating: number, comment: string) {
    if (!ratingTarget || !profile) return;
    setRatingProcessing(true);

    if (ratingTarget.type === "artisan") {
      await supabase.from("artisan_ratings").upsert({
        artisan_id: ratingTarget.id,
        reviewer_id: profile.id,
        rating,
        comment: comment || null,
      }, { onConflict: "artisan_id,reviewer_id" });
      setRatedArtisans((prev) => new Set([...prev, ratingTarget.id]));
    } else {
      await supabase.from("product_ratings").upsert({
        product_id: ratingTarget.id,
        reviewer_id: profile.id,
        rating,
        comment: comment || null,
      }, { onConflict: "product_id,reviewer_id" });
      setRatedProducts((prev) => new Set([...prev, ratingTarget.id]));
    }

    setRatingProcessing(false);
    setRatingTarget(null);
  }

  return (
    <section className={styles.hero}>

      {/* Welcome Banner */}
      <div className={styles.welcomeBanner} style={{backgroundColor: "var(--primary-container)"}}>
        <div className={styles.welcomeContent}>
          <span className={styles.workspaceTag}>{t("customerDashboard.workspace")}</span>
          <h3 className={styles.welcomeName}>{t("customerDashboard.namaste")}, {profile?.name?.split(" ")[0] || t("customerDashboard.collector")}</h3>
          <p className={styles.welcomeText}>{t("customerDashboard.thankYou")}</p>
        </div>
        <div className={styles.welcomeIcon}>
          <span className="material-symbols-outlined" style={{fontSize: "inherit"}}>shopping_cart</span>
        </div>
        <div className={styles.welcomePattern}></div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>shopping_bag</span>
            </div>
          </div>
          <p className={styles.kpiValue}>{totalOrders}</p>
          <p className={styles.kpiLabel}>{t("customerDashboard.totalOrders")}</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>payments</span>
            </div>
          </div>
          <p className={styles.kpiValue}>₹{totalSpent}</p>
          <p className={styles.kpiLabel}>{t("customerDashboard.totalSpent")}</p>
        </div>
      </div>

      <div className={styles.middleSection}>
        <div style={{gridColumn: "1 / -1"}}>
          
          {/* Pending Reviews Section */}
          {pendingReviews.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle} style={{ color: "var(--primary)" }}>{t("customerDashboard.pendingReviews")}</h4>
              </div>
              <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {pendingReviews.map((r) => (
                  <div key={`${r.type}-${r.id}`} style={{ 
                    minWidth: "260px", border: "1px solid var(--outline-variant)", 
                    borderRadius: "0.5rem", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem",
                    backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                  }}>
                    <div style={{ width: "45px", height: "45px", borderRadius: r.type === "artisan" ? "50%" : "0.35rem", overflow: "hidden", backgroundColor: "var(--surface-container-high)", flexShrink: 0 }}>
                      {r.image ? <img src={r.image} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="material-symbols-outlined" style={{ color: "gray", fontSize: "1.5rem" }}>{r.type === "artisan" ? "person" : "category"}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "gray", textTransform: "capitalize" }}>{t("customerDashboard.rate")} {r.type}</p>
                    </div>
                    <button 
                      onClick={() => setRatingTarget(r)}
                      style={{ 
                        background: "var(--primary-container)", color: "var(--on-primary-container)", border: "none", 
                        borderRadius: "2rem", padding: "0.35rem 1rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700,
                        transition: "background 0.2s"
                      }}
                       onMouseOver={(e) => (e.currentTarget.style.background = "var(--primary)", e.currentTarget.style.color = "white")}
                       onMouseOut={(e) => (e.currentTarget.style.background = "var(--primary-container)", e.currentTarget.style.color = "var(--on-primary-container)")}
                    >
                      {t("customerDashboard.rate")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order History Section */}
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>{t("customerDashboard.orderHistory")}</h4>
          </div>
          {loading ? (
            <Spinner label="Loading history..." />
          ) : purchases.length === 0 ? (
            <p className={styles.empty}>{t("customerDashboard.emptyHistory")}</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.salesTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Artifact</th>
                    <th>Status</th>
                    <th className={styles.amountHeader}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td style={{color: "gray", fontSize: "12px"}}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.tableProductInfo}>
                           <div className={styles.tableProductImgBox}>
                            {p.product?.image_url ? (
                              <img src={p.product.image_url} alt="" className={styles.tableProductImg} />
                            ) : (
                              <div style={{background: '#e0e0e0', width: '100%', height:'100%', borderRadius: '4px'}}></div>
                            )}
                          </div>
                          <div>
                            <span className={styles.productName}>{p.product?.name ?? "Unknown Product"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={p.status === "completed" ? styles.statusCompleted : styles.statusPending} style={{ textTransform: "capitalize" }}>
                          {p.status}
                        </span>
                      </td>
                      <td className={styles.amount}>₹{p.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <RatingModal
        isOpen={ratingTarget !== null}
        onClose={() => setRatingTarget(null)}
        title={`Rate ${ratingTarget?.name}`}
        onSubmit={handleSubmitRating}
        isProcessing={ratingProcessing}
      />
    </section>
  );
}

export default CustomerDashboard;
