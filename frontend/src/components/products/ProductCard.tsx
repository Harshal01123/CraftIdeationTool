import styles from "./ProductCard.module.css";

type ProductCardProps = {
  title: string;
  description?: string;
  artist?: string ;
};

function ProductCard({ title, description = "Displaying product", artist = "Vaishnavi Kataria" }: ProductCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail} />
      <h4>{title}</h4>
      <p>Description: {description}</p>
      <h5>Artist: {artist}</h5>
    </div>
  );
}

export default ProductCard;
