import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Product, Profile } from "../../types/chat";
import Spinner from "../Spinner";
import PriceSetDialog from "./PriceSetDialog";
import styles from "./ArtisanProductPicker.module.css";

interface Props {
  artisan: Profile;
  onOfferConfirmed: (product: Product, price: number) => void;
  onBack: () => void;
  isProcessing?: boolean;
}

export default function ArtisanProductPicker({ artisan, onOfferConfirmed, onBack, isProcessing }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("artisan_id", artisan.id)
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data as Product[]) ?? []);
        setLoading(false);
      });
  }, [artisan.id]);

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h4 className={styles.heading}>{artisan.name}'s Products</h4>
            <p className={styles.subheading}>Select a product to make an offer</p>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}><Spinner label="Loading products..." /></div>
        ) : products.length === 0 ? (
          <p className={styles.empty}>This artisan has no products listed.</p>
        ) : (
          <div className={styles.grid}>
            {products.map((p) => (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardThumb}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className={styles.cardImg} />
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: "1.75rem", opacity: 0.3 }}>image</span>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardName}>{p.name}</p>
                  {p.category && <p className={styles.cardCategory}>{p.category}</p>}
                  <p className={styles.cardPrice}>₹{p.price.toLocaleString()}</p>
                </div>
                <button
                  className={styles.offerBtn}
                  onClick={() => setSelected(p)}
                  disabled={isProcessing}
                >
                  <span className="material-symbols-outlined">local_offer</span>
                  Make Offer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PriceSetDialog
          product={selected}
          onConfirm={(price) => { onOfferConfirmed(selected, price); setSelected(null); }}
          onClose={() => setSelected(null)}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
}
