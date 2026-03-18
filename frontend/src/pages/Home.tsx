import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import Button from "../components/Button";

function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.home}>
      {/* ================= NAV ================= */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate("/")}>
          कलाkriti
        </div>
        <nav className={styles.navLinks}>
          <a href="#curator">For the Curator</a>
          <a href="#learner">For the Learner</a>
          <a href="#artisan">For the Artisan</a>
        </nav>
        <div className={styles.auth}>
          <button className={styles.navBtn} onClick={() => navigate("/login")}>Login</button>
          <Button variant="primary" onClick={() => navigate("/signup")}>Sign Up</Button>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Where Craft<br />Meets Culture
          </h1>
          <p className={styles.heroSubtitle}>
            A digital curator dedicated to the timeless beauty of Indian hand-artistry.
            Bridging the gap between the master artisan and the modern connoisseur.
          </p>
          <div className={styles.heroActions}>
            <Button variant="primary" onClick={() => navigate("/dashboard/products")}>Explore Collection</Button>
          </div>
        </div>
      </section>

      {/* ================= ECOSYSTEM ================= */}
      <section className={styles.ecosystemSection} id="curator">
        <h2 className={styles.sectionTitle}>The Ecosystem of Creation</h2>
        <div className={styles.ecosystemGrid}>
          <div className={styles.ecoCard}>
            <h3>For the Curator</h3>
            <p>Discover authenticated heritage pieces from remote clusters, delivered with the story of their origin.</p>
          </div>
          <div className={styles.ecoCard}>
            <h3>For the Learner</h3>
            <p>Master the ancient techniques directly from National Award-winning gurus through immersive courses.</p>
          </div>
          <div className={styles.ecoCard}>
            <h3>For the Artisan</h3>
            <p>Join a global platform designed to preserve your legacy and provide sustainable fair-trade opportunities.</p>
          </div>
        </div>
      </section>

      {/* ================= MASTER CRAFTSMEN ================= */}
      <section className={styles.craftsmenSection} id="artisan">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Master Craftsmen</h2>
          <button className={styles.linkRaw} onClick={() => navigate("/dashboard/artisans")}>
            View Artisan Directory
          </button>
        </div>
        
        <div className={styles.craftsmenGrid}>
          {[
            {
              name: "Madan Lal",
              specialty: "Blue Pottery Master",
              location: "Jaipur, Rajasthan",
              initials: "ML"
            },
            {
              name: "Savitri Devi",
              specialty: "Madhubani Artist",
              location: "Madhubani, Bihar",
              initials: "SD"
            },
            {
              name: "Rameshwar Das",
              specialty: "Brass Smith",
              location: "Moradabad, UP",
              initials: "RD"
            },
            {
              name: "Meera Bai",
              specialty: "Ajrakh Weaver",
              location: "Kutch, Gujarat",
              initials: "MB"
            }
          ].map(artisan => (
            <div key={artisan.name} className={styles.artisanCard}>
              <div className={styles.avatarPlaceholder}>{artisan.initials}</div>
              <div className={styles.artisanInfo}>
                <h3 className={styles.artisanName}>{artisan.name}</h3>
                <p className={styles.artisanSpecialty}>{artisan.specialty}</p>
                <p className={styles.artisanLocation}>{artisan.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= MASTERCLASS SERIES ================= */}
      <section className={styles.masterclassSection} id="learner">
        <h2 className={styles.sectionTitle}>Masterclass Series</h2>
        <div className={styles.masterclassGrid}>
          {[
            "The Art of Blue Pottery",
            "Handloom Fundamentals",
            "Mastering Zardozi"
          ].map((title, i) => (
            <div key={i} className={styles.courseCard}>
              <div className={styles.courseImagePlaceholder}></div>
              <div className={styles.courseInfo}>
                <h3>{title}</h3>
                <button className={styles.linkRaw} onClick={() => navigate("/dashboard/courses")}>
                  Explore Course
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className={styles.footer}>
        <div className={styles.logo}>कलाkriti</div>
        <div className={styles.footerLinks}>
          <span>Contact Us</span>
          <span>About Us</span>
          <span>Privacy Policy</span>
          <span>Terms & Conditions</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
