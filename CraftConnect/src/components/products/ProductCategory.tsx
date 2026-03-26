import ProductCard from "./ProductCard";
import styles from "./ProductCategory.module.css";
import type { Product } from "../../types/chat";

type ProductCategoryProps = {
  title: string;
  products: Product[];
  onBuy?: (product: Product) => void;
};

function ProductCategory({ title, products, onBuy }: ProductCategoryProps) {
  return (
    <section className={styles.category}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            price={`₹${product.price}`}
            description={product.description ?? ""}
            artisanName={product.artisan?.name}
            imageUrl={product.image_url}
            onBuy={onBuy ? () => onBuy(product) : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export default ProductCategory;
