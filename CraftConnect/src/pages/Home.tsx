import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Home.module.css";
import LanguageSwitcher from "../components/LanguageSwitcher";

function Home() {
  const { t } = useTranslation();
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
        <div className={styles.navToggleCenter}>
          <LanguageSwitcher />
        </div>
        <div className={styles.auth}>
          <button className={styles.loginBtn} onClick={() => navigate("/login")}>{t('nav.login')}</button>
          <button className={styles.signUpBtn} onClick={() => navigate("/signup")}>{t('nav.signup')}</button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <header className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              {t('hero.title1')}<span className={styles.heroTitleItalic}>{t('hero.titleItalic')}</span><br />{t('hero.title2')}
            </h1>
            <p className={styles.heroSubtitle}>
              {t('hero.subtitle')}
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
          <h2 className={styles.sectionTitle}>{t('ecosystem.title')}</h2>
        </div>
        <div className={styles.ecosystemGrid}>
          <div className={styles.ecoCard}>
            <h3>{t('ecosystem.customer.title')}</h3>
            <p>{t('ecosystem.customer.desc')}</p>
          </div>
          <div className={styles.ecoCard}>
            <h3>{t('ecosystem.learner.title')}</h3>
            <p>{t('ecosystem.learner.desc')}</p>
          </div>
          <div className={styles.ecoCard}>
            <h3>{t('ecosystem.artisan.title')}</h3>
            <p>{t('ecosystem.artisan.desc')}</p>
          </div>
        </div>
      </section>

      {/* ================= MASTER CRAFTSMEN ================= */}
      <section className={styles.craftsmenSection} id="artisan">
        <div className={styles.craftsmenContainer}>
          <h2 className={styles.sectionTitleLeft}>{t('craftsmen.title')}</h2>
          <div className={styles.craftsmenGrid}>
            {[
              {
                name: "Hirabai Jhareka Baghel",
                specialty: t('artisans.specialties.dhokra'),
                location: t('artisans.locations.sarangarh'),
                initials: "HJ",
                img : "/images/hirbaiPFP.avif"
              },
              {
                name: "Udayram Jhara",
                specialty: t('artisans.specialties.dhokra'),
                location: t('artisans.locations.raigarh'),
                initials: "UJ",
                img : "/images/udayramPFP.jpg"
              },
              {
                name: "Jagat Ram Dewangan",
                specialty: t('artisans.specialties.tuma'),
                location: t('artisans.locations.kondagaon'),
                initials: "JRD",
                img : "/images/jagatPFP.webp"
              },
              {
                name: "Pandiram Mandavi",
                specialty: t('artisans.specialties.instrument'),
                location: t('artisans.locations.bastar'),
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
          <h2 className={styles.sectionTitle}>{t('masterclass.title')}</h2>
        </div>
        <div className={styles.masterclassGrid}>
          {[
            { title: t('masterclass.course1'), img: "/images/bluePottery.jpg" }, 
            { title: t('masterclass.course2'), img: "/images/handloom.jpg" },
            { title: t('masterclass.course3'), img: "/images/zardozi.jpg" }
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
        <div className={styles.footerCopyright}>{t('footer.copyright')}</div>
        <div className={styles.footerLinks}>
          <span className={styles.disclaimerLink} onClick={() => setShowPopup(true)}>{t('footer.terms.disclaimer')}</span>
        </div>
      </footer>

      {showPopup && (
        <div className={styles.popupOverlay} onClick={closePopup}>
          <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
            <h3>{t('popup.title')}</h3>
            <p>{t('popup.desc')}</p>
            <button className={styles.closeBtn} onClick={closePopup}>{t('popup.close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
