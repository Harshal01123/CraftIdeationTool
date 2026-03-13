import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ArtisanPortfolio.module.css";
import ProductCard from "../components/products/ProductCard";
import Spinner from "../components/Spinner";
import { supabase } from "../lib/supabase";
import type { Profile, Product } from "../types/chat";

function ArtisanPortfolio() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [convTitle, setConvTitle] = useState("");
  const [dialogError, setDialogError] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      const [
        { data: artisanData, error },
        { data: sessionData },
        { data: productsData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .eq("role", "artisan")
          .single(),
        supabase.auth.getSession(),
        supabase
          .from("products")
          .select("*")
          .eq("artisan_id", id)
          .eq("is_available", true)
          .order("created_at", { ascending: false }),
      ]);

      if (error || !artisanData) setNotFound(true);
      else setArtisan(artisanData as Profile);

      if (sessionData.session) setCurrentUserId(sessionData.session.user.id);
      setProducts((productsData as Product[]) ?? []);
      setProductsLoading(false);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  // Called when user clicks "Chat" button
  async function handleChatClick() {
    if (!artisan || !currentUserId) return;
    if (currentUserId === artisan.id) {
      alert("You cannot start a chat with yourself.");
      return;
    }

    // Always show dialog to start a fresh conversation
    setConvTitle(`Chat with ${artisan.name}`);
    setDialogError("");
    setShowDialog(true);
  }

  // Called when user confirms title in dialog
  async function handleCreateConversation() {
    if (!convTitle.trim()) {
      setDialogError("Please enter a title.");
      return;
    }
    if (!artisan || !currentUserId) return;

    setChatLoading(true);

    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        artisan_id: artisan.id,
        customer_id: currentUserId,
        title: convTitle.trim(),
        status: "OPEN",
      })
      .select("id")
      .single();

    setChatLoading(false);

    if (error || !newConv) {
      setDialogError("Failed to start conversation. Please try again.");
      return;
    }

    setShowDialog(false);
    navigate(`/dashboard/messages?conversation=${newConv.id}`);
  }

  if (loading)
    return (
      <div className={styles.container}>
        <Spinner label="Loading..." />
      </div>
    );

  if (notFound || !artisan) {
    return (
      <div className={styles.container}>
        <p>Artisan not found.</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUserId === artisan.id;

  return (
    <div className={styles.container}>
      {/* Title dialog overlay */}
      {showDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>Start a Conversation</h3>
            <p className={styles.dialogSubtitle}>
              Give this conversation a title
            </p>
            <input
              className={styles.dialogInput}
              type="text"
              value={convTitle}
              onChange={(e) => {
                setConvTitle(e.target.value);
                setDialogError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreateConversation()}
              placeholder="e.g. Custom pottery order"
              autoFocus
            />
            {dialogError && <p className={styles.dialogError}>{dialogError}</p>}
            <div className={styles.dialogActions}>
              <button
                className={styles.dialogCancel}
                onClick={() => setShowDialog(false)}
                disabled={chatLoading}
              >
                Cancel
              </button>
              <button
                className={styles.dialogConfirm}
                onClick={handleCreateConversation}
                disabled={chatLoading}
              >
                {chatLoading ? (
                  <>
                    <Spinner size="sm" inline />
                    Starting...
                  </>
                ) : (
                  "Start Chat"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <img
          src={artisan.avatar_url ?? "/images/dummyPFP.jpg"}
          alt={artisan.name}
          className={styles.profileImage}
        />
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{artisan.name}</h1>
          {artisan.industry && (
            <p className={styles.industry}>{artisan.industry}</p>
          )}
          {artisan.location && (
            <p className={styles.location}>📍 {artisan.location}</p>
          )}
        </div>
        {!isOwnProfile && (
          <button
            className={styles.chatBtn}
            onClick={handleChatClick}
            disabled={chatLoading}
          >
            Chat
          </button>
        )}
      </div>

      {artisan.description && (
        <section className={styles.about}>
          <h2 className={styles.sectionHeading}>About</h2>
          <p>{artisan.description}</p>
        </section>
      )}

      <h2 className={styles.sectionHeading}>Products</h2>
      {productsLoading ? (
        <Spinner label="Loading products..." />
      ) : products.length === 0 ? (
        <p style={{ color: "gray" }}>No products listed yet.</p>
      ) : (
        <div className={styles.productsGrid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              price={`₹${product.price}`}
              description={product.description ?? ""}
              imageUrl={product.image_url}
              artisanName={artisan.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ArtisanPortfolio;
