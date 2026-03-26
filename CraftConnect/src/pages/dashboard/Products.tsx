import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types/chat";
import ProductCard from "../../components/products/ProductCard";
import Spinner from "../../components/Spinner";
import ContactDialog from "../../components/chat/ContactDialog";
import { startConversation } from "../../lib/chatUtils";
import styles from "./Products.module.css";
import { useAuth } from "../../hooks/useAuth";

function Products() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from("products")
        .select("*, artisan:profiles!artisan_id(id, name, avatar_url)")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (data) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category?.trim() || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (
        selectedCategory &&
        (p.category?.trim() || "Uncategorized") !== selectedCategory
      )
        return false;
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  function handleBuyClick(product: Product) {
    if (!profile) return alert("Please log in to purchase.");
    if (profile.role !== "customer")
      return alert("Only customers can purchase items.");

    setSelectedProduct(product);
    setShowDialog(true);
  }

  async function handleConfirmOrder(messageText: string) {
    if (!selectedProduct || !profile) return;
    setProcessing(true);

    const result = await startConversation({
      customerId: profile.id,
      artisanId: selectedProduct.artisan_id,
      title: `Order: ${selectedProduct.name}`,
      productId: selectedProduct.id,
      productPrice: selectedProduct.price,
      messageText,
      isOrder: true,
    });

    setProcessing(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    setShowDialog(false);
    navigate(`/dashboard/messages?conversation=${result.conversationId}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.filterBar}>
        <div className={styles.headerLeft}>
          <h2 className={styles.pageTitle}>Products</h2>
          <span className={styles.hindiSubtitle}>उत्पाद</span>
          <span className={styles.subtitle} style={{ marginLeft: "1rem" }}>
            ({filteredProducts.length} Artifacts)
          </span>
        </div>
        <div className={styles.filterRight}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search heritage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <section className={styles.heroSection}>
        <div className={styles.heroBanner}>
          <div className={styles.heroContent}>
            <span className={styles.heroHindi}>विरासत</span>
            <h2 className={styles.heroTitle}>Handpicked Collection</h2>
            <p className={styles.heroDesc}>
              Discover rare artifacts sourced directly from master artisans
              across the Indian subcontinent. Each piece tells a story of
              generation-spanning craftsmanship.
            </p>
            <button className={styles.heroBtn}>Explore Archive</button>
          </div>
        </div>
      </section>

      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.filterSection}>
            <h3 className={styles.filterLabel}>Categories</h3>
            <ul className={styles.categoryList}>
              <li
                className={`${styles.categoryItem} ${
                  selectedCategory === null ? styles.categoryItemActive : ""
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                <span className={styles.catName}>All Collections</span>
                <span className={styles.catCount}>({products.length})</span>
              </li>
              {categories.map(([cat, count]) => (
                <li
                  key={cat}
                  className={`${styles.categoryItem} ${
                    selectedCategory === cat ? styles.categoryItemActive : ""
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className={styles.catName}>{cat}</span>
                  <span className={styles.catCount}>({count})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterLabel}>Region</h3>
            <div className={styles.pillGroup}>
              <button className={styles.pill}>Chhattisgarh</button>
              <button className={styles.pill}>Rajasthan</button>
              <button className={styles.pill}>Jharkhand</button>
              <button className={styles.pill}>West Bengal</button>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterLabel}>Price Range</h3>
            <div className={styles.rangeWrapper}>
              <div className={styles.rangeTrack}>
                <div className={styles.rangeFill}></div>
              </div>
              <div className={styles.rangeLabels}>
                <span>₹500</span>
                <span>₹50,000+</span>
              </div>
            </div>
          </div>

          <div className={styles.promoCard}>
            <h4 className={styles.promoTitle}>Artisan Spotlight</h4>
            <p className={styles.promoDesc}>
              Meet Rameshwar, the master of blue pottery from Jaipur.
            </p>
            <a href="/dashboard/artisans" className={styles.promoLink}>
              Read Story
            </a>
          </div>
        </aside>

        <div className={styles.contentArea}>
          {loading ? (
            <div className={styles.loader}>
              <Spinner label="Loading artifacts..." />
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className={styles.emptyText}>No artifacts found.</p>
          ) : (
            <div className={styles.grid}>
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  name={p.name}
                  price={`₹${p.price}`}
                  description={p.description ?? ""}
                  artisanName={p.artisan?.name}
                  imageUrl={p.image_url}
                  onBuy={
                    profile?.role === "customer"
                      ? () => handleBuyClick(p)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ContactDialog
        isOpen={showDialog && selectedProduct !== null}
        onClose={() => setShowDialog(false)}
        artisanName={selectedProduct?.artisan?.name}
        productName={selectedProduct?.name}
        isProcessing={processing}
        onSubmit={handleConfirmOrder}
        mode="order"
      />
    </div>
  );
}

export default Products;
