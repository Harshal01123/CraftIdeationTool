import styles from "./ArtisanPortfolio.module.css";
import ProductCard from "../components/products/ProductCard";
import Button from "../components/Button";

const products = [
  {
    name: "Pottery Vase",
    price: "Price: ₹500",
    description: "A beautifully handcrafted clay vase.",
    artisanName: "Ketan Rakesh",
  },
  {
    name: "Ceramic Plate",
    price: "Price: ₹300",
    description: "Hand-painted decorative plate.",
    artisanName: "Ketan Rakesh",
  },
  {
    name: "Clay Mug",
    price: "Price: ₹200",
    description: "Rustic mug with textured finish.",
    artisanName: "Ketan Rakesh",
  },
  {
    name: "Decorative Bowl",
    price: "Price: ₹450",
    description: "Hand-carved design, ideal for fruit.",
    artisanName: "Ketan Rakesh",
  },
  {
    name: "Wall Hanging",
    price: "Price: ₹600",
    description: "Artistic piece to brighten any room.",
    artisanName: "Ketan Rakesh",
  },
  {
    name: "Small Planter",
    price: "Price: ₹250",
    description: "Perfect for succulents and herbs.",
    artisanName: "Ketan Rakesh",
  },
  {
    name: "Tea Set",
    price: "Price: ₹1200",
    description: "Set of four cups and a teapot.",
    artisanName: "Ketan Rakesh",
  },
  {
    name: "Coaster Set",
    price: "Price: ₹150",
    description: "Set of six coasters with glaze finish.",
    artisanName: "Ketan Rakesh",
  },
];

function ArtisanPortfolio() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img
          src="/images/dummyPFP.jpg"
          alt="Artisan Profile"
          className={styles.profileImage}
        />
        <h1 className={styles.title}>Ketan Rakesh</h1>
        <Button variant="secondary" className={styles.chatButton}>
          CHAT
        </Button>
      </div>

      <section className={styles.details}>
        <p>
          <strong>Industry:</strong> Pottery
        </p>
        <p>
          <strong>Location:</strong> Kutelabhata, Bhilai, Durg, Chattisgarh
        </p>
      </section>

      <h2 className={styles.productsHeading}>Products</h2>
      <div className={styles.productsGrid}>
        {products.map((product, index) => (
          <ProductCard
            key={index}
            name={product.name}
            price={product.price}
            description={product.description}
            artisanName={product.artisanName}
          />
        ))}
      </div>
    </div>
  );
}

export default ArtisanPortfolio;