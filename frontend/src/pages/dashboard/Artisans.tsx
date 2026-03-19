import { useEffect, useState } from "react";
import styles from "./Artisans.module.css";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/chat";
import Spinner from "../../components/Spinner";

function Artisans() {
  const [artisans, setArtisans] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtisans() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "artisan");

      if (!error && data) {
        setArtisans(data as Profile[]);
      }
      setLoading(false);
    }

    fetchArtisans();
  }, []);

  return (
    <div className={styles.page}>
      
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.pageTitle}>Artisans</h2>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Find an artisan by craft..." />
          </div>
        </div>
      </header>

      <div className={styles.contentWrap}>
        
        {/* Featured Spotlight Section */}
        <section className={styles.spotlight}>
          <div className={styles.spotlightCard}>
            <div className={styles.spotlightImgWrapper}>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG93m86mlZdkVgiZSmuZsyX4X5baxI7jZuneP-tYDKYp08y0h0tO58pjT5FV_h8xLmeTKAFEkvXFogSVVngSnmDrjtuMZsIzrsaaEFR9gd16IwqmYrVOfaydeS7-gvrMTDwKP3y-qMh1ChztY51rissfh9kNVK1dNoBwsNUsc7zcA6Nzfu6EAMDAJW6XvjSLcjPjNgYwosDaHlRSiK1RTmQvqCG6R7UIvbVjvRlZN8SL0WXLOUu8KWNXoWTT8WCvzPS2UxtRvRlZ8" 
                alt="Master artisan" 
                className={styles.spotlightImg} 
              />
              <div className={styles.imgOverlay}></div>
            </div>
            
            <div className={styles.spotlightContent}>
              <div className={styles.decoTopRight}></div>
              <div className={styles.decoBottomLeft}></div>
              
              <span className={styles.spotlightTag}>Featured Master Artisan</span>
              <h3 className={styles.spotlightTitle}>
                Savitri Devi <span className={styles.hindiTitle}>सावित्री देवी</span>
              </h3>
              <p className={styles.spotlightQuote}>
                "The clay speaks to me in rhythms of my ancestors. Every vessel is a bridge between the earth and our shared memory."
              </p>
              
              <div className={styles.spotlightMeta}>
                <span className={styles.giTag}>GI Tag: Madhubani Pottery</span>
                <span className={styles.masterGrade}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  4.9 Master Grade
                </span>
              </div>
              
              <div className={styles.spotlightActions}>
                <button className={styles.btnPrimary}>Read Her Story</button>
                <button className={styles.btnOutline}>Explore Works</button>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
            <button className={`${styles.filterPill} ${styles.filterPillActive}`}>All Artisans</button>
            <button className={styles.filterPill}>State: Rajasthan</button>
            <button className={styles.filterPill}>Craft: Block Print</button>
            <button className={styles.filterPill}>GI Tag Certified</button>
            <button className={styles.filterPill}>Master Craftsperson</button>
            <div className={styles.divider}></div>
            <button className={styles.advancedFilter}>
                <span className="material-symbols-outlined">tune</span>
                Advanced Filters
            </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loader}><Spinner label="Loading artisans..." /></div>
        ) : artisans.length === 0 ? (
          <p className={styles.emptyText}>No artisans found.</p>
        ) : (
          <div className={styles.grid}>
            {artisans.map(artisan => (
               <div key={artisan.id} className={styles.artisanCard}>
                 <div className={styles.cardHeader}>
                    <div className={styles.avatarWrapper}>
                       <img 
                          src={artisan.avatar_url || "/images/dummyAvatar.jpg"} 
                          alt={artisan.name} 
                          className={styles.avatarImg} 
                       />
                       <div className={styles.verifiedBadge}>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                       </div>
                    </div>
                    <div className={styles.headerInfo}>
                       <h4 className={styles.artisanName}>{artisan.name}</h4>
                       <p className={styles.artisanIndustry}>{artisan.industry || "Master Artisan"}</p>
                       <p className={styles.artisanLocation}>
                          <span className="material-symbols-outlined">location_on</span>
                          India
                       </p>
                    </div>
                 </div>
                 
                 <div className={styles.cardBody}>
                    <p className={styles.artisanBio}>
                       {(artisan as any).bio || "Traditional artisan preserving ancient heritage crafts with skills passed down for generations."}
                    </p>
                    <div className={styles.cardTags}>
                       <span className={styles.miniTag}>Verified Profile</span>
                       <span className={styles.miniTag}>Artisan Guild</span>
                    </div>
                 </div>
                 
                 <div className={styles.cardActions}>
                    <button className={styles.viewProfileBtn}>View Profile</button>
                    <button className={styles.mailBtn}>
                       <span className="material-symbols-outlined">mail</span>
                    </button>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Artisans;
