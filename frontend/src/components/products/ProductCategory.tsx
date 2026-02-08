import ProductCard from "./ProductCard.tsx";
import styles from "./ProductCategory.module.css";

type ProductCategoryProps = {
  title: string;
  videos: string[];
};

function ProductCategory({ title, videos }: ProductCategoryProps) {
  return (
    <section className={styles.category}>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.grid}>
        {videos.map((video) => (
          <ProductCard key={video} title={video} />
        ))}
      </div>
    </section>
  );
}

export default ProductCategory;
