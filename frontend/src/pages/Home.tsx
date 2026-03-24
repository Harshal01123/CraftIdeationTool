import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import Button from "../components/Button";

function Home() {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={styles.home}>
      {/* ================= NAV ================= */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate("/")}>
          CraftConnect
        </div>
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
        </div>
        
        <div className={styles.heroGrid}>
          <div className={styles.gridColumn}>
            <img src="/images/bluePottery.jpg" alt="Blue Pottery" className={`${styles.gridImage} ${styles.imgShort}`} />
            <img src="/images/handloom.jpg" alt="Handloom" className={`${styles.gridImage} ${styles.imgTall}`} />
          </div>
          <div className={styles.gridColumn}>
            <img src="/images/zardozi.jpg" alt="Zardozi" className={`${styles.gridImage} ${styles.imgTall}`} />
            <img src="/images/home_section_1.jpg" alt="Indian Crafts" className={`${styles.gridImage} ${styles.imgShort}`} />
          </div>
        </div>
      </section>

      {/* ================= ECOSYSTEM ================= */}
      <section className={styles.ecosystemSection} id="customer">
        <h2 className={styles.sectionTitle}>Message from the DEVS</h2>
        <div className={styles.ecosystemGrid}>
          <div className={styles.ecoCard}>
            <h3>For the Customer</h3>
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
            { title: "The Art of Blue Pottery", img: "/images/bluePottery.jpg" }, 
            { title: "Handloom Fundamentals", img: "/images/handloom.jpg" },
            { title: "Mastering Zardozi", img: "/images/zardozi.jpg" }
          ].map((course, i) => (
            <div key={i} className={styles.courseCard}>
              <img src={course.img} alt={course.title} className={styles.courseImage} />
              <div className={styles.courseInfo}>
                <h3>{course.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className={styles.footer}>
        <div className={styles.logo}>CraftConnect</div>
        <div className={styles.footerLinks}>
          <span className={styles.disclaimerLink} onClick={() => setShowPopup(true)}>Disclaimer</span>
        </div>
      </footer>

      {showPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowPopup(false)}>
          <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
            <h3>Disclaimer</h3>
            <p>
              This website is only for connecting Chhattisgarh craftsmen with customers and give people a chance to learn a wide variety of traditional crafts via verified tutors. This site does not offer payment gateways and also does not ask for any donations. Happy exploring!
            </p>
            <button className={styles.closeBtn} onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
