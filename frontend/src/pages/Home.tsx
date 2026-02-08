import SliderButton from "../components/SliderButton";
import styles from "./Home.module.css";
import ArtisanCard from "../components/ArtisanCard";
import Button from "../components/Button";
import {useNavigate} from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  return (
    <div className={styles.home}>
      {/* ================= HEADER ================= */}
      <header className={styles.header}>
        {/* Top Row */}
        <div className={styles.headerTop}>
          {/* Left: Logo */}
          <div className={styles.logo}>
            <h2>CraftLogo</h2>
          </div>

          {/* Center: Page Name */}
          <div className={styles.pageTitle}>
            <h1>Home</h1>
          </div>

          {/* Right: Auth Buttons */}
          <div className={styles.authButtons}>
            <Button variant ="secondary" onClick={() => navigate("/login")}>Login</Button>
            <Button variant ="secondary" onClick={() => navigate("/signup")}>Signup</Button>
          </div>
        </div>

        {/* Navbar */}
        <nav className={styles.navbar}>
            <div>Craft With Us</div>
            <div>Buy From Us</div>
            <div>Learn With Us</div>
        </nav>
      </header>

      {/* ================= BODY ================= */}
      <main className={styles.body}>
        {/* Section 1: Full Width Image Slider */}
        <section className={styles.sliderSection}>
          <SliderButton direction = "left">◀</SliderButton>

          <div className={styles.sliderImage}>
          </div>

          <SliderButton direction = "right">▶</SliderButton>
        </section>

        {/* Section 2: Top Artisans Cards */}
<section className={styles.artisanSection}>
  <h2>Top Artisans</h2>

  <div className={styles.artisanCards}>
    {[
      {
        name: "Aarav Sharma",
        specialty: "Pottery",
      },
      {
        name: "Meera Das",
        specialty: "Bamboo Craft",
      },
      {
        name: "Ravi Kumar",
        specialty: "Glass Art",
      },
      {
        name: "Ananya Roy",
        specialty: "Painting",
      },
      {
        name: "Kunal Verma",
        specialty: "Wood Craft",
      },
      {
        name: "Pooja Singh",
        specialty: "Textiles",
      },
    ].map((artisan) => (
      <ArtisanCard
        key={artisan.name}
        name={artisan.name}
        specialty={artisan.specialty}
      />
    ))}
  </div>
</section>


        {/* Section 3: Another Full Width Image Slider */}
        <section className={styles.sliderSection}>
          <SliderButton direction = "left">◀</SliderButton>

          <div className={styles.sliderImage}>
          </div>

          <SliderButton direction = "right">▶</SliderButton>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className={styles.footer}>
          <div>Contact Us</div>
          <div>About Us</div>
          <div>Privacy Policy</div>
          <div>Terms & Conditions</div>
      </footer>
    </div>
  );
}

export default Home;
