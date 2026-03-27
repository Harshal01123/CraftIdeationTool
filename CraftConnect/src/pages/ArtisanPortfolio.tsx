import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ArtisanPortfolio.module.css";
import Spinner from "../components/Spinner";
import ContactDialog from "../components/chat/ContactDialog";
import RatingModal from "../components/ratings/RatingModal";
import ReviewCard from "../components/ratings/ReviewCard";
import StarRating from "../components/ratings/StarRating";
import { supabase } from "../lib/supabase";
import type { Profile, Product, ArtisanRating } from "../types/chat";

function ArtisanPortfolio() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [reviews, setReviews] = useState<ArtisanRating[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogError, setDialogError] = useState("");

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingProcessing, setRatingProcessing] = useState(false);
  const [existingRating, setExistingRating] = useState(0);
  const [existingComment, setExistingComment] = useState("");

  async function fetchReviews() {
    if (!id) return;
    const [{ data: ratingsData }, { data: avgData }] = await Promise.all([
      supabase
        .from("artisan_ratings")
        .select("*, reviewer:profiles!reviewer_id(id, name, avatar_url)")
        .eq("artisan_id", id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("artisan_avg_ratings")
        .select("avg_rating, total_ratings")
        .eq("artisan_id", id)
        .maybeSingle(),
    ]);
    if (ratingsData) setReviews(ratingsData as ArtisanRating[]);
    if (avgData) {
      setAvgRating(Number(avgData.avg_rating) || 0);
      setTotalRatings(Number(avgData.total_ratings) || 0);
    }
  }

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

      if (sessionData.session) {
        const uid = sessionData.session.user.id;
        setCurrentUserId(uid);

        // fetch role
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .single();
        if (profileData) setCurrentUserRole(profileData.role);

        // fetch existing rating by this user
        const { data: myRating } = await supabase
          .from("artisan_ratings")
          .select("rating, comment")
          .eq("artisan_id", id)
          .eq("reviewer_id", uid)
          .maybeSingle();
        if (myRating) {
          setExistingRating(myRating.rating);
          setExistingComment(myRating.comment ?? "");
        }
      }

      setProducts((productsData as Product[]) ?? []);
      setProductsLoading(false);
      setLoading(false);
      await fetchReviews();
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
    setDialogError("");
    setShowDialog(true);
  }

  async function handleSubmitRating(rating: number, comment: string) {
    if (!id || !currentUserId) return;
    setRatingProcessing(true);
    await supabase.from("artisan_ratings").upsert(
      { artisan_id: id, reviewer_id: currentUserId, rating, comment: comment || null },
      { onConflict: "artisan_id,reviewer_id" }
    );
    setRatingProcessing(false);
    setShowRatingModal(false);
    setExistingRating(rating);
    setExistingComment(comment);
    await fetchReviews();
  }

  // Called when user confirms title in dialog
  async function handleCreateConversation(title: string) {
    if (!title.trim()) {
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
        title: title.trim(),
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
      {/* Hero / Header */}
      <section className={styles.heroSection}>
        <div className={styles.avatarGroup}>
          <div className={styles.avatarRing}>
            <img
              src={artisan.avatar_url ?? "/images/dummyPFP.jpg"}
              alt={artisan.name}
              className={styles.avatarImg}
            />
          </div>
          <div className={styles.verifiedBadge}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "1rem" }}
            >
              verified
            </span>
          </div>
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.artisanName}>{artisan.name}</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaIndustry}>
              {artisan.industry || "Master Artisan"}
            </span>
            <div className={styles.metaDivider}></div>
            <div className={styles.metaLocation}>
              <span className="material-symbols-outlined">location_on</span>
              {artisan.location || "India"}
            </div>
            {totalRatings > 0 && (
              <>
                <div className={styles.metaDivider}></div>
                <div className={styles.metaRating}>
                  <StarRating value={avgRating} size="sm" />
                  <span className={styles.metaRatingText}>
                    {avgRating.toFixed(1)} ({totalRatings})
                  </span>
                </div>
              </>
            )}
          </div>
          <div className={styles.actionRow}>
            {!isOwnProfile && (
              <button
                className={styles.chatBtn}
                onClick={handleChatClick}
                disabled={chatLoading}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "1.25rem", marginRight: "0.5rem", verticalAlign: "middle" }}
                >
                  chat
                </span>
                Chat with Artisan
              </button>
            )}
            {isOwnProfile && (
              <button
                className={styles.viewProfileBtn}
                onClick={() => navigate("/dashboard/profile")}
              >
                Edit Profile
              </button>
            )}
            {!isOwnProfile && currentUserRole === "customer" && (
              <button
                className={styles.rateArtisanBtn}
                onClick={() => setShowRatingModal(true)}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "1.1rem" }}>star</span>
                {existingRating ? "Edit Rating" : "Rate Artisan"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className={styles.aboutSection}>
        <div className={styles.aboutContent}>
          <div className={styles.aboutBox}>
            <div className={styles.aboutQuoteIcon}>
              <span className="material-symbols-outlined">format_quote</span>
            </div>
            <h3 className={styles.aboutTitle}>About the Artisan</h3>
            <div className={styles.aboutText}>
              <p>
                {artisan.description ||
                  "This artisan has not provided a description yet."}
              </p>
              {artisan.description && artisan.description.length > 50 && (
                <div className={styles.aboutQuote}>
                  "
                  {artisan.description.substring(
                    0,
                    Math.min(artisan.description.length, 120),
                  )}
                  ..."
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.detailsCol}>
          <div className={styles.detailsBox}>
            <h4 className={styles.detailsTitle}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "1.125rem" }}
              >
                cognition
              </span>
              Craftsmanship Details
            </h4>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Industry</span>
              <span className={styles.detailValue}>
                {artisan.industry || "Local Artist"}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Experience</span>
              <span className={styles.detailValue}>
                {artisan.experience || "Not Specified"}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Location</span>
              <span className={styles.detailValue}>
                {artisan.location || "Chhattisgarh"}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Authenticity</span>
              <span className={`${styles.detailValue} ${styles.highlight}`}>
                Verified Seller
              </span>
            </div>
          </div>

          <div className={styles.atWorkImgBox}>
            <img
              src={artisan.avatar_url ?? "/images/dummyPFP.jpg"}
              alt="Artisan at work"
            />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className={styles.productsSection}>
        <div className={styles.productsHeader}>
          <div>
            <h3 className={styles.productsTitle}>
              The {artisan.name.split(" ").pop()} Archive
            </h3>
            <p className={styles.productsSubtitle}>
              Available hand-sculpted works
            </p>
          </div>
          {products.length > 0 && (
            <span className={styles.viewAllLink}>Explore Full Collection</span>
          )}
        </div>

        {productsLoading ? (
          <Spinner label="Loading products..." />
        ) : products.length === 0 ? (
          <p style={{ color: "gray", fontStyle: "italic" }}>
            No products listed yet.
          </p>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <div
                key={product.id}
                className={styles.artisanProductCard}
                onClick={() => navigate("/dashboard/products/" + product.id)}
              >
                <div className={styles.artisanProductImgBox}>
                  <img src={product.image_url ?? ""} alt={product.name} />
                </div>
                <h4 className={styles.artisanProductTitle}>{product.name}</h4>
                <div className={styles.artisanProductMetaRow}>
                  <p className={styles.artisanProductCategory}>Handcrafted</p>
                  <span className={styles.artisanProductPrice}>
                    ₹{product.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviews Section */}
      <section className={styles.reviewsSection}>
        <div className={styles.reviewsHeader}>
          <h3 className={styles.reviewsTitle}>Reviews & Ratings</h3>
          {!isOwnProfile && currentUserRole === "customer" && (
            <button
              className={styles.writeReviewBtn}
              onClick={() => setShowRatingModal(true)}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "1rem" }}>star</span>
              {existingRating ? "Edit Your Review" : "Write a Review"}
            </button>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className={styles.noReviews}>No reviews yet. Be the first to review this artisan!</p>
        ) : (
          <div className={styles.reviewsList}>
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                reviewerName={r.reviewer?.name ?? "Anonymous"}
                reviewerAvatar={r.reviewer?.avatar_url}
                rating={r.rating}
                comment={r.comment}
                createdAt={r.created_at}
              />
            ))}
          </div>
        )}
      </section>

      {/* Contact Dialog */}
      <ContactDialog
        isOpen={showDialog}
        onClose={() => { setShowDialog(false); setDialogError(""); }}
        artisanName={artisan.name}
        isProcessing={chatLoading}
        error={dialogError}
        mode="new_conversation"
        onSubmit={handleCreateConversation}
      />

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title={`Rate ${artisan.name}`}
        onSubmit={handleSubmitRating}
        isProcessing={ratingProcessing}
        existingRating={existingRating}
        existingComment={existingComment}
      />
    </div>
  );
}

export default ArtisanPortfolio;
