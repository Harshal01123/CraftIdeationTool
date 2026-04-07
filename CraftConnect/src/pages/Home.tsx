import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import styles from "./Home.module.css";
import LanguageSwitcher from "../components/LanguageSwitcher";
import BugReport from "../components/BugReport";

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
          <motion.div 
            className={styles.heroContent}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className={styles.heroTitle}>
              {t('hero.title1')}<span className={styles.heroTitleItalic}>{t('hero.titleItalic')}</span><br />{t('hero.title2')}
            </h1>
            <p className={styles.heroSubtitle}>
              {t('hero.subtitle')}
            </p>
          </motion.div>
          
          {/* Photo Collage */}
          <motion.div 
            className={styles.heroCollage}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
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
          </motion.div>
        </div>
      </header>

      {/* ================= MESSAGE FROM THE DEVS ================= */}
      <motion.section 
        className={styles.ecosystemSection} id="customer"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
      >
        <div className={styles.ecosystemHeader}>
          <h2 className={styles.sectionTitle}>{t('ecosystem.title')}</h2>
        </div>
        <div className={styles.ecosystemGrid}>
          <motion.div 
            className={styles.ecoCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3>{t('ecosystem.customer.title')}</h3>
            <p>{t('ecosystem.customer.desc')}</p>
          </motion.div>
          <motion.div 
            className={styles.ecoCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3>{t('ecosystem.learner.title')}</h3>
            <p>{t('ecosystem.learner.desc')}</p>
          </motion.div>
          <motion.div 
            className={styles.ecoCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3>{t('ecosystem.artisan.title')}</h3>
            <p>{t('ecosystem.artisan.desc')}</p>
          </motion.div>
        </div>
      </motion.section>

      {/* ================= MASTER CRAFTSMEN ================= */}
      <motion.section 
        className={styles.craftsmenSection} id="artisan"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
      >
        <div className={styles.craftsmenContainer}>
          <h2 className={styles.sectionTitleLeft}>{t('craftsmen.title')}</h2>
          <div className={styles.craftsmenGrid}>
            {[
              {
                name: "Hirabai Jhareka Baghel",
                specialty: t('artisans.specialties.dhokra'),
                location: t('artisans.locations.sarangarh'),
                initials: "HJ",
                img : "/images/hirabaiPFP.jpg"
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
            ].map((artisan, index) => (
              <motion.div 
                key={artisan.name} 
                className={styles.artisanCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={styles.artisanImageContainer}>
                  <img src={artisan.img} alt={artisan.initials} className={styles.artisanImage} />
                </div>
                <div className={styles.artisanInfo}>
                  <h3 className={styles.artisanName}>{artisan.name}</h3>
                  <p className={styles.artisanSpecialty}>{artisan.specialty}</p>
                  <p className={styles.artisanLocation}>{artisan.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================= MASTERCLASS SERIES ================= */}
      <motion.section 
        className={styles.masterclassSection} id="learner"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
      >
        <div className={styles.masterclassHeader}>
          <h2 className={styles.sectionTitle}>{t('masterclass.title')}</h2>
        </div>
        <div className={styles.masterclassGrid}>
          {[
            { title: t('masterclass.course1'), img: "/images/bluePottery.jpg" }, 
            { title: t('masterclass.course2'), img: "/images/handloom.jpg" },
            { title: t('masterclass.course3'), img: "/images/zardozi.jpg" }
          ].map((course, i) => (
            <motion.div 
              key={i} 
              className={styles.courseCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className={styles.courseImageContainer}>
                <img src={course.img} alt={course.title} className={styles.courseImage} />
              </div>
              <div className={styles.courseInfo}>
                <h3>{course.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ================= FOOTER ================= */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>CraftConnect</div>
        <BugReport />
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
