import ProductCategory from "../../components/products/ProductCategory";
import styles from "./Products.module.css";

const productCategories = [
  {
    title: "Pottery",
    videos: ["Product", "Product", "Product", "Product"],
  },
  {
    title: "Bamboo Making",
    videos: ["Product", "Product", "Product", "Product"],
  },
  {
    title: "Glass Decorating",
    videos: ["Product", "Product", "Product", "Product"],
  },
  {
    title: "Painting",
    videos: ["Product", "Product", "Product", "Product"],
  },
];

function Products() {
  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Products</h2>

      {productCategories.map((category) => (
        <ProductCategory
          key={category.title}
          title={category.title}
          videos={category.videos}
        />
      ))}
    </div>
  );
}

export default Products;
