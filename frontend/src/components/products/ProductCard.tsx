import styles from "./ProductCard.module.css";

type ProductCardProps = {
  name: string;
  price: string;
  description?: string;
  artisanName?: string;
  imageUrl?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onBuy?: () => void;
};

function ProductCard({
  name,
  price,
  artisanName,
  imageUrl,
  onEdit,
  onDelete,
  onBuy,
}: ProductCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img
          alt={name}
          className={styles.productImage}
          src={imageUrl || "/images/dummyProduct.jpg"}
        />
        <button className={styles.favoriteBtn}>
          <span className="material-symbols-outlined">favorite</span>
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
          <div className={styles.stars}>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="material-symbols-outlined">star</span>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete || onBuy) && (
          <div className={styles.actions}>
            {onEdit && (
              <button className={styles.editBtn} onClick={onEdit}>
                Edit
              </button>
            )}
            {onDelete && (
              <button className={styles.deleteBtn} onClick={onDelete}>
                Delete
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
                <span>Buy Now</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default ProductCard;
