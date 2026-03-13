import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types/chat";
import ProductCategory from "../../components/products/ProductCategory";
import Spinner from "../../components/Spinner";
import styles from "./Products.module.css";
import { useAuth } from "../../hooks/useAuth";

function Products() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [grouped, setGrouped] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [messageText, setMessageText] = useState("");
  const [processing, setProcessing] = useState(false);

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

  function handleBuyClick(product: Product) {
    if (!profile) return alert("Please log in to purchase.");
    if (profile.role !== "customer")
      return alert("Only customers can purchase items.");

    setSelectedProduct(product);
    setMessageText(""); // Changed: Start with empty message
    setShowDialog(true);
  }

  async function handleConfirmOrder() {
    if (!selectedProduct || !profile) return;
    setProcessing(true);

    // 1. Create Conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({
        artisan_id: selectedProduct.artisan_id,
        customer_id: profile.id,
        title: `Order: ${selectedProduct.name}`,
        status: "OPEN",
      })
      .select("id")
      .single();

    if (convError || !conv) {
      console.error(convError);
      alert("Failed to start order chat.");
      setProcessing(false);
      return;
    }

    // 2. Create Purchase Record (Pending)
    const { error: purchaseError } = await supabase.from("purchases").insert({
      customer_id: profile.id,
      product_id: selectedProduct.id,
      artisan_id: selectedProduct.artisan_id,
      total_price: selectedProduct.price,
      status: "pending",
      conversation_id: conv.id,
      confirmed_by_customer: false,
      confirmed_by_artisan: false,
    });

    if (purchaseError) {
      console.error(purchaseError);
      alert("Failed to create order record.");
      setProcessing(false);
      return;
    }

    // 3. Send Initial Message (User's custom message)
    if (messageText.trim()) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: profile.id,
        sender_role: "customer",
        type: "TEXT",
        content: messageText.trim(),
      });
    }

    // 4. Send System Message (Order Context)
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: null,
      sender_role: "system",
      type: "SYSTEM",
      content: `Order request started for ${selectedProduct.name} (₹${selectedProduct.price}). Waiting for mutual confirmation.`,
    });

    setProcessing(false);
    setShowDialog(false);
    navigate(`/dashboard/messages?conversation=${conv.id}`);
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Products</h2>

      {loading ? (
        <Spinner label="Loading products..." />
      ) : Object.keys(grouped).length === 0 ? (
        <p style={{ color: "gray" }}>No products available yet.</p>
      ) : (
        Object.entries(grouped).map(([category, products]) => (
          <ProductCategory
            key={category}
            title={category}
            products={products}
            onBuy={profile?.role === "customer" ? handleBuyClick : undefined}
          />
        ))
      )}

      {showDialog && selectedProduct && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h3>Contact Artisan</h3>
            <p>
              Start a chat with <strong>{selectedProduct.artisan?.name}</strong>{" "}
              to order <strong>{selectedProduct.name}</strong>.
            </p>

            <textarea
              className={styles.dialogInput}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a short message to artisan (optional)..."
              rows={3}
            />

            <div className={styles.dialogActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowDialog(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirmOrder}
                disabled={processing}
              >
                {processing ? (
                  <Spinner size="sm" inline label="Starting Chat..." />
                ) : (
                  "Start Order Chat"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
