import { useTranslation } from "react-i18next";
import styles from "./ProductCard.module.css";
import { useWishlist } from "../../hooks/useWishlist";
import StarRating from "../ratings/StarRating";

type ProductCardProps = {
  id: string;
  name: string;
  price: string;
  description?: string;
  artisanName?: string;
  imageUrl?: string | null;
  avgRating?: number;
  totalRatings?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onBuy?: () => void;
  onView?: () => void;   // navigate to product portfolio
};

function ProductCard({
  id,
  name,
  price,
  artisanName,
  imageUrl,
  avgRating = 0,
  totalRatings = 0,
  onEdit,
  onDelete,
  onBuy,
  onView,
}: ProductCardProps) {
  const { t } = useTranslation();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const isWishlisted = wishlistIds.has(id);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img
          alt={name}
          className={styles.productImage}
          src={imageUrl || "/images/dummyProduct.jpg"}
        />
        <button
          className={`${styles.favoriteBtn} ${isWishlisted ? styles.wishlisted : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleWishlist(id);
          }}
        >
          <span
            className="material-symbols-outlined"
            style={isWishlisted ? { fontVariationSettings: "'FILL' 1", color: "#d32f2f" } : {}}
          >
            favorite
          </span>
        </button>
      </div>
      <div className={styles.content}>
        <div className={styles.topInfo}>
          <span className={styles.categoryTag}>Craft</span>
          <span className={styles.dot}></span>
          <span className={styles.locationTag}>India</span>
        </div>

        <h3 className={styles.productName}>{name}</h3>

        {artisanName && (
          <p className={styles.artisanCredit}>
            Crafted by <span className={styles.artisanLink}>{artisanName}</span>
          </p>
        )}

        <div className={styles.priceRow}>
          <span className={styles.productPrice}>{price}</span>
          <div className={styles.ratingDisplay}>
            <StarRating value={avgRating} size="sm" />
            <span className={styles.ratingCount}>
              {totalRatings > 0 ? `(${totalRatings})` : "No reviews"}
            </span>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete || onBuy || onView) && (
          <div className={styles.actions}>
            {onView && (
              <button className={styles.viewBtn} onClick={onView}>
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                  visibility
                </span>
                <span>{t("extended.viewProduct")}</span>
              </button>
            )}
            {onEdit && (
              <button className={styles.editBtn} onClick={onEdit}>
                Edit
              </button>
            )}
            {onDelete && (
              <button className={styles.deleteBtn} onClick={onDelete}>
                {t("extended.delete")}
              </button>
            )}
            {onBuy && (
              <button className={styles.buyBtn} onClick={onBuy}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "1.2rem" }}
                >
                  shopping_bag
                </span>
                <span>{t("extended.buyNow")}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default ProductCard;
