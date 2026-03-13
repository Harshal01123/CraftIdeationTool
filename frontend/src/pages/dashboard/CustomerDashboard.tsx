import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Purchase } from "../../types/chat";
import Spinner from "../../components/Spinner";
import styles from "./CustomerDashboard.module.css";

function CustomerDashboard({ customerId }: { customerId: string }) {
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
          event: "INSERT",
          schema: "public",
          table: "purchases",
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          fetchPurchases();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "purchases",
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          fetchPurchases();
        },
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
    <section className={styles.container}>
      <h2>My Purchases</h2>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <h3>Total Orders</h3>
          <p>{totalOrders}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Spent</h3>
          <p>₹{totalSpent}</p>
        </div>
      </div>

      <h3 className={styles.subheading}>Order History</h3>

      {loading ? (
        <Spinner label="Loading history..." />
      ) : purchases.length === 0 ? (
        <p className={styles.empty}>You haven't purchased anything yet.</p>
      ) : (
        <div className={styles.purchaseList}>
          {purchases.map((p) => (
            <div key={p.id} className={styles.purchaseCard}>
              {p.product?.image_url ? (
                <img
                  src={p.product.image_url}
                  alt={p.product.name}
                  className={styles.productThumb}
                />
              ) : (
                <div className={styles.productThumbFallback} />
              )}

              <div className={styles.info}>
                <h4>{p.product?.name ?? "Unknown Product"}</h4>
                <p className={styles.date}>
                  {new Date(p.created_at).toLocaleDateString()}
                </p>
                <span className={styles.status}>{p.status}</span>
              </div>

              <div className={styles.priceTag}>₹{p.total_price}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CustomerDashboard;
