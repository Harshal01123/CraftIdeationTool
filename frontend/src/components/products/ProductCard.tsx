import styles from "./ProductCard.module.css";

type ProductCardProps = {
  name: string;
  price: string;
  description: string;
  artisanName: string;
};

function ProductCard({ name, price, description, artisanName }: ProductCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.productImage} />
      <h4 className={styles.productName}>{name}</h4>
      <p className={styles.productPrice}>{price}</p>
      <p className={styles.productDescription}>{description}</p>
      <h5 className={styles.artisanName}>Artisan: {artisanName}</h5>
    </div>
  );
}

export default ProductCard;