import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
// import Button from "../components/Button"; // removed since we use raw buttons matching the design system directly.

function Home() {
  const [showPopup, setShowPopup] = useState(
    () => !localStorage.getItem("craftconnect_disclaimer_seen")
  );
  const navigate = useNavigate();

  function closePopup() {
    localStorage.setItem("craftconnect_disclaimer_seen", "1");
    setShowPopup(false);
  }

  return (
    <div className={styles.home}>
      <div className={styles.paperGrain}></div>
      {/* ================= NAV ================= */}
      <nav className={styles.navBar}>
        <div className={styles.logo} onClick={() => navigate("/")}>
          CraftConnect
        </div>
        <div className={styles.navLinks}>
        </div>
        <div className={styles.auth}>
          <button className={styles.loginBtn} onClick={() => navigate("/login")}>Login</button>
          <button className={styles.signUpBtn} onClick={() => navigate("/signup")}>Sign Up</button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <header className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Where <span className={styles.heroTitleItalic}>Craft</span><br />Meets Culture
            </h1>
            <p className={styles.heroSubtitle}>
              A digital curator dedicated to the timeless beauty of Indian hand-artistry. Bridging the gap between the master artisan and the modern connoisseur.
            </p>
          </div>
          
          {/* Photo Collage */}
          <div className={styles.heroCollage}>
            <div className={styles.collageMain}>
              <img src="/images/bluePottery.jpg" alt="Master Artisan at Pottery Wheel" className={styles.collageImgMain} />
            </div>
            <div className={styles.collageTopRight}>
              <img src="/images/zardozi.jpg" alt="Zardozi Heritage Embroidery" className={styles.collageImgTopRight} />
            </div>
            <div className={styles.collageBottomLeft}>
              <img src="/images/handloom.jpg" alt="Traditional Handloom Weaving" className={styles.collageImgBottomLeft} />
            </div>
            <div className={styles.collageBottomRight}>
              <img src="/images/home_section_1.jpg" alt="Authentic Block Printing" className={styles.collageImgBottomRight} />
            </div>
          </div>
        </div>
      </header>

      {/* ================= MESSAGE FROM THE DEVS ================= */}
      <section className={styles.ecosystemSection} id="customer">
        <div className={styles.ecosystemHeader}>
          <h2 className={styles.sectionTitle}>Message from the DEVS</h2>
        </div>
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
        <div className={styles.craftsmenContainer}>
          <h2 className={styles.sectionTitleLeft}>Master Craftsmen</h2>
          <div className={styles.craftsmenGrid}>
            {[
              {
                name: "Hirabai Jhareka Baghel",
                specialty: "Dhokra Artisan",
                location: "Sarangarh, Chhattisgarh",
                initials: "HJ",
                img : "/images/hirbaiPFP.avif"
              },
              {
                name: "Udayram Jhara",
                specialty: "Dhokra Artisan",
                location: "Raigarh, Chhattisgarh",
                initials: "UJ",
                img : "/images/udayramPFP.jpg"
              },
              {
                name: "Jagat Ram Dewangan",
                specialty: "Tuma Artisan",
                location: "Kondagaon, Chhattisgarh",
                initials: "JRD",
                img : "/images/jagatPFP.webp"
              },
              {
                name: "Pandiram Mandavi",
                specialty: "Instrument Artisan",
                location: "Bastar, Chhattisgarh",
                initials: "PM",
                img : "/images/pandiramPFP.webp"
              }
            ].map(artisan => (
              <div key={artisan.name} className={styles.artisanCard}>
                <div className={styles.artisanImageContainer}>
                  <img src={artisan.img} alt={artisan.initials} className={styles.artisanImage} />
                </div>
                <div className={styles.artisanInfo}>
                  <h3 className={styles.artisanName}>{artisan.name}</h3>
                  <p className={styles.artisanSpecialty}>{artisan.specialty}</p>
                  <p className={styles.artisanLocation}>{artisan.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MASTERCLASS SERIES ================= */}
      <section className={styles.masterclassSection} id="learner">
        <div className={styles.masterclassHeader}>
          <h2 className={styles.sectionTitle}>Masterclass Series</h2>
        </div>
        <div className={styles.masterclassGrid}>
          {[
            { title: "The Art of Blue Pottery", img: "/images/bluePottery.jpg" }, 
            { title: "Handloom Fundamentals", img: "/images/handloom.jpg" },
            { title: "Mastering Zardozi", img: "/images/zardozi.jpg" }
          ].map((course, i) => (
            <div key={i} className={styles.courseCard}>
              <div className={styles.courseImageContainer}>
                <img src={course.img} alt={course.title} className={styles.courseImage} />
              </div>
              <div className={styles.courseInfo}>
                <h3>{course.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>CraftConnect</div>
        <div className={styles.footerCopyright}>© 2024 CraftConnect. All rights reserved.</div>
        <div className={styles.footerLinks}>
          <span className={styles.disclaimerLink} onClick={() => setShowPopup(true)}>Disclaimer</span>
        </div>
      </footer>

      {showPopup && (
        <div className={styles.popupOverlay} onClick={closePopup}>
          <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
            <h3>Disclaimer</h3>
            <p>
              This website is only for connecting Chhattisgarh craftsmen with customers and give people a chance to learn a wide variety of traditional crafts via verified tutors. This site does not offer payment gateways and also does not ask for any donations. Happy exploring!
            </p>
            <button className={styles.closeBtn} onClick={closePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
