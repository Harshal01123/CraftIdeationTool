import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Purchase } from "../../types/chat";
import Spinner from "../../components/Spinner";
import styles from "./Dashboard.module.css";

function CustomerDashboard({ customerId }: { customerId: string }) {
  const { profile } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPurchases() {
    const { data } = await supabase
      .from("purchases")
      .select("*, product:products(*)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    setPurchases((data as Purchase[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchPurchases();

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
        () => fetchPurchases(),
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

  return (
    <section className={styles.hero}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner} style={{backgroundColor: "var(--primary-container)"}}>
        <div className={styles.welcomeContent}>
          <span className={styles.workspaceTag}>Collector Workspace</span>
          <h3 className={styles.welcomeName}>Namaste, {profile?.name?.split(" ")[0] || "Collector"}</h3>
          <p className={styles.welcomeText}>Thank you for supporting India's rich cultural heritage. Your purchases empower generations of artisans.</p>
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
          <p className={styles.kpiLabel}>Total Orders</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>payments</span>
            </div>
          </div>
          <p className={styles.kpiValue}>₹{totalSpent}</p>
          <p className={styles.kpiLabel}>Total Spent</p>
        </div>
      </div>

      <div className={styles.middleSection}>
        <div style={{gridColumn: "1 / -1"}}>
          {/* Order History Section matched with Stitch Layout */}
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Order History</h4>
          </div>
          {loading ? (
            <Spinner label="Loading history..." />
          ) : purchases.length === 0 ? (
            <p className={styles.empty}>You haven't purchased anything yet.</p>
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
                        <span className={p.status === "completed" ? styles.statusCompleted : styles.statusPending}>
                          {p.status}
                        </span>
                      </td>
                      <td className={styles.amount}>₹{p.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CustomerDashboard;
