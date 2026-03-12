import styles from "./ProductCard.module.css";

type ProductCardProps = {
  name: string;
  price: string;
  description: string;
  artisanName?: string;
  imageUrl?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
};

function ProductCard({
  name,
  price,
  description,
  artisanName,
  imageUrl,
  onEdit,
  onDelete,
}: ProductCardProps) {
  return (
    <div className={styles.card}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className={styles.productImage} />
      ) : (
        <div className={styles.productImagePlaceholder} />
      )}
      <h4 className={styles.productName}>{name}</h4>
      <p className={styles.productPrice}>{price}</p>
      <p className={styles.productDescription}>{description}</p>
      {artisanName && (
        <h5 className={styles.artisanName}>Artisan: {artisanName}</h5>
      )}
      {(onEdit || onDelete) && (
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
        </div>
      )}
    </div>
  );
}

export default ProductCard;
