import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types/chat";
import ProductCategory from "../../components/products/ProductCategory";
import styles from "./Products.module.css";

function Products() {
  const [grouped, setGrouped] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from("products")
        .select("*, artisan:profiles!artisan_id(id, name, avatar_url)")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (!data) {
        setLoading(false);
        return;
      }

      const groups: Record<string, Product[]> = {};
      for (const product of data as Product[]) {
        const key = product.category?.trim() || "Uncategorized";
        if (!groups[key]) groups[key] = [];
        groups[key].push(product);
      }
      setGrouped(groups);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Products</h2>

      {loading ? (
        <p>Loading products...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p style={{ color: "gray" }}>No products available yet.</p>
      ) : (
        Object.entries(grouped).map(([category, products]) => (
          <ProductCategory
            key={category}
            title={category}
            products={products}
          />
        ))
      )}
    </div>
  );
}

export default Products;
