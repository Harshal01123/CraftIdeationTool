import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Product, Profile, ProductRating } from "../types/chat";
import Spinner from "../components/Spinner";
import StarRating from "../components/ratings/StarRating";
import RatingModal from "../components/ratings/RatingModal";
import ReviewCard from "../components/ratings/ReviewCard";
import OfferFlowCoordinator from "../components/chat/OfferFlowCoordinator";
import styles from "./ProductPortfolio.module.css";

function ProductPortfolio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [artisan, setArtisan] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<ProductRating[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingProcessing, setRatingProcessing] = useState(false);
  const [existingRating, setExistingRating] = useState(0);
  const [existingComment, setExistingComment] = useState("");

  const [showContactDialog, setShowContactDialog] = useState(false);

  async function fetchReviews() {
    if (!id) return;
    const [{ data: ratingsData }, { data: avgData }] = await Promise.all([
      supabase
        .from("product_ratings")
        .select("*, reviewer:profiles!reviewer_id(id, name, avatar_url)")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("product_avg_ratings")
        .select("avg_rating, total_ratings")
        .eq("product_id", id)
        .maybeSingle(),
    ]);
    if (ratingsData) setReviews(ratingsData as ProductRating[]);
    if (avgData) {
      setAvgRating(Number(avgData.avg_rating) || 0);
      setTotalRatings(Number(avgData.total_ratings) || 0);
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      const [{ data: productData, error }, { data: sessionData }] = await Promise.all([
        supabase.from("products").select("*, artisan:profiles!artisan_id(*)").eq("id", id).single(),
        supabase.auth.getSession(),
      ]);
      if (error || !productData) { setNotFound(true); setLoading(false); return; }
      const prod = productData as Product & { artisan: Profile };
      setProduct(prod);
      setArtisan(prod.artisan ?? null);

      if (sessionData.session) {
        const uid = sessionData.session.user.id;
        setCurrentUserId(uid);
        const { data: myRating } = await supabase
          .from("product_ratings").select("rating, comment")
          .eq("product_id", id).eq("reviewer_id", uid).maybeSingle();
        if (myRating) { setExistingRating(myRating.rating); setExistingComment(myRating.comment ?? ""); }
      }
      await fetchReviews();
      setLoading(false);
    }
    fetchData();
  }, [id]);

  async function handleSubmitRating(rating: number, comment: string) {
    if (!id || !currentUserId) return;
    setRatingProcessing(true);
    await supabase.from("product_ratings").upsert(
      { product_id: id, reviewer_id: currentUserId, rating, comment: comment || null },
      { onConflict: "product_id,reviewer_id" }
    );
    setRatingProcessing(false);
    setShowRatingModal(false);
    setExistingRating(rating);
    setExistingComment(comment);
    await fetchReviews();
  }

  if (loading) return <div className={styles.loadingWrap}><Spinner label="Loading product..." /></div>;
  if (notFound || !product) return (
    <div className={styles.loadingWrap}>
      <p>Product not found.</p>
      <button className={styles.backLink} onClick={() => navigate(-1)}>← Back</button>
    </div>
  );

  const isOwner = currentUserId === product.artisan_id;

  function handleConversationStarted(conversationId: string) {
    setShowContactDialog(false);
    navigate(`/dashboard/messages?conversation=${conversationId}`);
  }

  return (
    <div className={styles.page}>

      {/* ─── Breadcrumb ─────────────────────────── */}
      <div className={styles.breadcrumb}>
        <button className={styles.breadcrumbLink} onClick={() => navigate("/dashboard/products")}>
          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>arrow_back</span>
          Collections
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </div>

      {/* ─── HERO — Image + Info ─────────────────── */}
      <section className={styles.hero}>
        {/* Left: Image column */}
        <div className={styles.imageCol}>
          <div className={styles.mainImgBox}>
            <img 
              src={product.image_url || "/images/dummyProduct.jpg"} 
              alt={product.name} 
              className={styles.mainImg} 
            />
          </div>
        </div>

        {/* Right: Info column */}
        <div className={styles.infoCol}>
          <span className={styles.scriptTag}>{product.category ?? "हस्तकला"}</span>
          <h1 className={styles.productTitle}>{product.name}</h1>

          {artisan && (
            <p className={styles.artisanLine}>
              Hand-crafted by{" "}
              <button className={styles.artisanNameBtn} onClick={() => navigate(`/dashboard/artisans/${artisan.id}`)}>
                {artisan.name}
              </button>
            </p>
          )}

          <blockquote className={styles.productQuote}>
            "{product.description ?? "A singular piece celebrating the primordial connection between soil and soul, captured in the rich clay of India's heritage."}"
          </blockquote>

          {/* Rating row */}
          {totalRatings > 0 && (
            <div className={styles.ratingRow}>
              <StarRating value={avgRating} size="sm" />
              <span className={styles.ratingText}>{avgRating.toFixed(1)} ({totalRatings} {totalRatings === 1 ? "review" : "reviews"})</span>
            </div>
          )}

          {/* CTA Buttons */}
          <div className={styles.ctaRow}>
            {!isOwner && (
              <button className={styles.enquireBtn} onClick={() => setShowRatingModal(true)}>
                ✦{" "}{existingRating ? "Edit Rating" : "Rate & Review"}
              </button>
            )}
            {!isOwner && (
              <button className={styles.cartBtn} onClick={() => setShowContactDialog(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.2rem", verticalAlign: "middle", marginRight: "6px" }}>shopping_bag</span>
                Buy Now
              </button>
            )}
          </div>

          {/* Specifications */}
          <div className={styles.specsBox}>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Category</span>
              <span className={styles.specValue}>{product.category ?? "Handcraft"}</span>
            </div>
            {product.dimensions && (
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Dimensions</span>
                <span className={styles.specValue}>{product.dimensions}</span>
              </div>
            )}
            {product.weight && (
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Weight</span>
                <span className={styles.specValue}>{product.weight}</span>
              </div>
            )}
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Origin</span>
              <span className={styles.specValue}>{artisan?.location ?? "India"}</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Price</span>
              <span className={`${styles.specValue} ${styles.priceVal}`}>
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Availability</span>
              <span className={`${styles.specValue} ${product.is_available ? styles.inStock : styles.outOfStock}`}>
                {product.is_available ? "In Stock" : "Unavailable"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CREATOR'S NOTE ──────────────────────── */}
      {artisan && (
        <section className={styles.creatorSection}>
          <div className={styles.creatorInner}>
            <div className={styles.creatorHeadRow}>
              <span className={styles.goldStar}>✦</span>
              <h2 className={styles.sectionTitle}>The Curator's Note</h2>
            </div>
            <p className={styles.creatorText}>
              <span className={styles.dropCap}>{(artisan.description ?? "T")[0]}</span>
              {(artisan.description ??
                "This creation is a testament to the dying embers of traditional Indian terracotta craft schools. Unlike commercial reproductions, this piece was forged from clay gathered manually after the monsoon retreat, ensuring a high iron content that yields a naturally rich, deep ochre when fired. The symbolism is rooted in the Harappan legacy of fertility idols, reimagined through the lens of modern minimalism. Every curve was smoothed using river pebbles — a technique that dates back three centuries — creating a tactile finish that feels more like aged leather than cold ceramic. To own this piece is to preserve a lineage of touch."
              ).slice(1)}
            </p>
            <div className={styles.artisanCard}>
              <img src={artisan.avatar_url ?? "/images/dummyPFP.jpg"} alt={artisan.name} className={styles.artisanCardAvatar} />
              <div>
                <p className={styles.artisanCardName}>{artisan.name}</p>
                <p className={styles.artisanCardRole}>{artisan.industry ?? "Master Artisan"} · {artisan.location ?? "India"}</p>
              </div>
              <button className={styles.viewArtisanBtn} onClick={() => navigate(`/dashboard/artisans/${artisan.id}`)}>
                View Portfolio
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── GALLERY ─────────────────────────────── */}
      {(() => {
        const allImages = [
          product.image_url,
          ...(product.additional_images || []),
        ].filter(Boolean);

        if (allImages.length === 0) return null;

        return (
          <section className={styles.gallerySection}>
            <h2 className={`${styles.sectionTitle} ${styles.galleryTitleCentered}`}>
              The Curator's Gallery
            </h2>
            <div
              className={styles.galleryGrid}
              style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(${
                  allImages.length <= 2 ? "400px" : "300px"
                }, 1fr))`,
              }}
            >
              {allImages.map((src, i) => (
                <div
                  key={i}
                  className={styles.galleryLarge}
                  style={{ aspectRatio: "5/4" }}
                >
                  <img
                    src={src as string}
                    alt={`${product.name} View ${i + 1}`}
                  />
                  <div className={styles.galleryCap}>Gallery View {i + 1}</div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ─── REVIEWS ─────────────────────────────── */}
      <section className={styles.reviewsSection}>
        <div className={styles.reviewsTopRow}>
          <h2 className={styles.sectionTitle}>Customer Reviews</h2>
          {totalRatings > 0 && (
            <div className={styles.overallRating}>
              <span className={styles.bigNum}>{avgRating.toFixed(1)}</span>
              <StarRating value={avgRating} size="md" />
              <span className={styles.reviewCount}>{totalRatings} reviews</span>
            </div>
          )}
        </div>

        {!isOwner && (
          <button className={styles.writeReviewBtn} onClick={() => setShowRatingModal(true)}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "1rem" }}>star</span>
            {existingRating ? "Edit Your Review" : "Write a Review"}
          </button>
        )}

        {reviews.length === 0 ? (
          <p className={styles.noReviews}>No reviews yet — be the first!</p>
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

      <OfferFlowCoordinator
        isOpen={showContactDialog}
        onClose={() => setShowContactDialog(false)}
        artisan={artisan}
        product={product}
        onConversationStarted={handleConversationStarted}
      />

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title={`Rate "${product.name}"`}
        onSubmit={handleSubmitRating}
        isProcessing={ratingProcessing}
        existingRating={existingRating}
        existingComment={existingComment}
      />
    </div>
  );
}

export default ProductPortfolio;
