import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ArtisanPortfolio.module.css";
import ProductCard from "../components/products/ProductCard";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types/chat";

// Static products for now — will be dynamic once products table has artisan_id
const staticProducts = [
  {
    name: "Pottery Vase",
    price: "₹500",
    description: "A beautifully handcrafted clay vase.",
  },
  {
    name: "Ceramic Plate",
    price: "₹300",
    description: "Hand-painted decorative plate.",
  },
  {
    name: "Clay Mug",
    price: "₹200",
    description: "Rustic mug with textured finish.",
  },
  {
    name: "Decorative Bowl",
    price: "₹450",
    description: "Hand-carved design, ideal for fruit.",
  },
  {
    name: "Wall Hanging",
    price: "₹600",
    description: "Artistic piece to brighten any room.",
  },
  {
    name: "Small Planter",
    price: "₹250",
    description: "Perfect for succulents and herbs.",
  },
];

function ArtisanPortfolio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchArtisan() {
      if (!id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("role", "artisan")
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setArtisan(data as Profile);
      }
      setLoading(false);
    }

    fetchArtisan();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (notFound || !artisan) {
    return (
      <div className={styles.container}>
        <p>Artisan not found.</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <img
          src="/images/dummyPFP.jpg"
          alt={artisan.name}
          className={styles.profileImage}
        />
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{artisan.name}</h1>
          {artisan.industry && (
            <p className={styles.industry}>{artisan.industry}</p>
          )}
          {artisan.location && (
            <p className={styles.location}>📍 {artisan.location}</p>
          )}
        </div>
        <button
          className={styles.chatBtn}
          onClick={() => navigate("/dashboard/messages")}
        >
          Chat
        </button>
      </div>

      {/* Description */}
      {artisan.description && (
        <section className={styles.about}>
          <h2 className={styles.sectionHeading}>About</h2>
          <p>{artisan.description}</p>
        </section>
      )}

      {/* Products */}
      <h2 className={styles.sectionHeading}>Products</h2>
      <div className={styles.productsGrid}>
        {staticProducts.map((product, index) => (
          <ProductCard
            key={index}
            name={product.name}
            price={product.price}
            description={product.description}
            artisanName={artisan.name}
          />
        ))}
      </div>
    </div>
  );
}

export default ArtisanPortfolio;
