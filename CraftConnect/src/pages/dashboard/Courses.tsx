import { useState } from "react";
import styles from "./Courses.module.css";

// Sample static data mapping from Stitch concept 
const NEW_COURSES = [
  {
    id: 1,
    category: "Textiles",
    title: "Indigo Dyeing: The Art of Natural Blue",
    instructor: "Sita Ramakrishnan",
    instructorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVJdsRBLjKfETG-Pu4gg_YrER8SGkT7fHezkQPryAlD7t5L4N9d1_jl1eqM8_l5jEsyG93ySC6fnQFdHPZAZ0dEOYLF3ZNhU876fYA4rc4c57a1cqGGjeAATRcVon3tPNBfObg8rrPBm2CjeGEOfBLRyx9WRG62xeqYOpJTVf00ku8a-pQWU1XNUdecp9FotD7BmsY3fphwYF-MENVwtNJd99WHZIBErc-dZeGM3sdJfVO7L6RYAIMb6amnkBTr-hWymo1BS8TC_g",
    rating: 4.9,
    lessons: 12,
    duration: "8h 30m",
    price: "₹3,499",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoY1fJuAs1t7iwAYywHxYXdjJuqBZEhnsEIUW3BFznre11N9fSdOZJS6dUVpBsgumZu21kcZ5zXnJBzReUhVzxrdxOEIo-dx1m-HszQ8AMpCdNJPGu9RrskipZQMNsuCzxApJ7-1aFc2nprYGCZKejsL6jx4d3ZIA-KLQNNtshXnTXgrTpOyGQ9YGvhT0Q2Cj5gdubDoeg-fmqNNPFVSL-DrkyBXbvDi8QUx4RtcuqublynA45TG0LheV1_AmNi1kxVs1V71KO0wQ",
    youtubeId: "9bZkp7q19f0" 
  },
  {
    id: 2,
    category: "Metalwork",
    title: "Bidriware Essentials: Silver Inlay Mastery",
    instructor: "Zeeshan Ali",
    instructorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuByVXAf5WXwdJKmPODUWrnLYaj9mXhfFMl7aBUuv658oA9-gB-1Mv6k1xcelywqPdZU_wjui3O635ii1CH9beneIQwJtIacq82Iu_OMQhhaxmh_Y2gzf-XtxsaHKrnyAkb_iazugHvokSEdYH8tBxwnmX6NQGe9x4i8sqCwDpDlohYohv-U9cCEH1zxFwNZeKg2UXLdXDB4bpwXzVtMGBX82ZcwE3iPqrcPIv8gV7nG4GcVBVk80EFWTUWZ4GemSSd-XXTtZDhepZw",
    rating: 5.0,
    lessons: 8,
    duration: "4h 15m",
    price: "₹2,899",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAE25cshmxk9WIbl6ookT7pY_aEumwDZ6wFMftoRdhAcuRaN41Wqk0Nn7CF4EixI2t_0UNM61s3Ai855ru9H3ToXX5UfraGZy-LaqX6SNX7ew-8D3KJfOiaCH9bHunRHeMjLNeJhokNBCIfOn1cRAv2RSw4PLtKxhOF4ITBYlYKKUodH53id1KNHWvJFE_kP1thCd_JiVTikUK4g4WM4WD0vjji7869eJm-YGQMpAMDd6wrNUPn9vVjs0NN_QXXlDwT_G1CrdPPfs",
    youtubeId: "OPf0YbXqDm0"
  },
  {
    id: 3,
    category: "Woodwork",
    title: "Channapatna Toys: Lacware Turning",
    instructor: "Rekha Gowda",
    instructorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgLEhw42YSI-iACLWnCUSZlmPI-gjnHmJXc9K24mwsV9tqJGh7YEpgWlfVWpsAk1aroAOoXcg4SOwytaVUifSd9ZNBq2Sc9lsfMASpg_QKk99oWnCc6NMRQ4qJPJE4cXO_fnevBAFCpHlI8ZhX7C_9Se1demMxZgjDmQJ4ts7IFWbRH7FsnjEnD2zZet4GUXuNI3UHcva-_afGEGm1iR42iCSJPm5fn7eTXVUvVl60B2xKSOK0q9Et112g-3m3Nb34RR_Wfq6DS8I",
    rating: 4.8,
    lessons: 15,
    duration: "12h 00m",
    price: "₹4,200",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlUdjV7D9608JfIpqiwKpgezcHwlyOFSD_ldgvJeKYl0eAplj0uxWXtzm46GRiAaWkDHwA2jCwcfaTUqulOcNukikgQjGBIDnSAiXT_FX9gMPQetUQG8YB-lViXHxwHFY1tMQ2-Bji7s-S-G3Dz96q4IPUx8ik_bzzIbovyLWE9ZBqLp_-l7Am1MuJVkg39NR6dXfSNdiEDmMJmjP5x4Ne75EV156WtW93jH3SrkrvGTBEhEwo9jIvu8JpzGDt08BnJ9blwFL1y5E",
    youtubeId: "hT_nvWreIhg"
  }
];

function Courses() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      
      {/* Top Header */}
      <div className={styles.filterBarTop}>
        <div className={styles.headerLeft}>
          <h2 className={styles.pageTitle}>Courses</h2>
          <span className={styles.hindiSubtitle}>शिक्षा</span>
        </div>
        <div className={styles.searchBox}>
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search Masterclasses..." />
        </div>
      </div>

      <div className={styles.contentWrap}>
        
        {/* Filters Row */}
        <section className={styles.filtersRow}>
          <div className={styles.filterBox}>
            <span className={styles.filterLabel}>Craft Type:</span>
            <select className={styles.filterSelect}>
              <option>All Crafts</option>
              <option>Pottery</option>
              <option>Textiles</option>
              <option>Jewelry</option>
            </select>
          </div>
          
          <div className={styles.filterBox}>
            <span className={styles.filterLabel}>Level:</span>
            <select className={styles.filterSelect}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Master</option>
            </select>
          </div>
          
          <div className={styles.filterBox}>
            <span className={styles.filterLabel}>Duration:</span>
            <select className={styles.filterSelect}>
              <option>Any length</option>
              <option>{`< 2 Hours`}</option>
              <option>Full Course</option>
            </select>
          </div>
          
          <div className={styles.filterBox}>
            <span className={styles.filterLabel}>Language:</span>
            <select className={styles.filterSelect}>
              <option>English</option>
              <option>Hindi</option>
              <option>Bengali</option>
            </select>
          </div>
        </section>

        {/* LIVE NOW Banner */}
        <section className={styles.liveBanner}>
           <div className={styles.liveBadge}>
              <span className={styles.pulseDot}></span>
              Live Now
           </div>
           
           <div className={styles.liveContent}>
              <h3 className={styles.liveTitle}>Terracotta Sculpting: <br/>Ancient Techniques, Modern Forms</h3>
              <div className={styles.liveMeta}>
                 <div className={styles.liveInstructor}>
                    <img 
                       src="https://lh3.googleusercontent.com/aida-public/AB6AXuDO_TnoAUvG8N6e-yQPc_-vyszvfiwdxVPoETMiXIGHux2OnbHbUes0QjD9J5rArZBtGk7UtKmuXcTHiYNJzxn80YfOxtQqjt6RQekbUNHj2v4jHCfwvjHx_ylWNghZMUi8F7Kyj4gtNJo7E0N-z6F0jmk9s1u9fhi_iKclLnkgn2PGWR7qsInuU39TAeoc_dU9IWlUijus7On0VMC-XhqziRrjeZ4wbo2h8pLvROShoo9siVynSLhL7yJBPbP1LgHTsLb9OwOoEeU" 
                       alt="Master Aniruddh Dev" 
                    />
                    <span>Master Aniruddh Dev</span>
                 </div>
                 <span className={styles.divider}>|</span>
                 <div className={styles.liveViewers}>
                    <span className="material-symbols-outlined">group</span>
                    <span>1,240 Watching</span>
                 </div>
              </div>
              <button className={styles.joinBtn} onClick={() => setActiveVideo("-YCGK33c0xs")}>Join Live Class</button>
           </div>
           
           <div className={styles.liveVideoWrapper}>
              <img 
                 src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwn-DM0b00rycYS9l8hKuC1WUFZLvldRuyOXxCUvA52Ug-SVdZGasBbYJMWLBA1v2LdtYuKrVVr4XfW00-uEU5fOpQuP5aMyyJG0l_64GKZeG-g1ICi57LA2O9n_HvW93AyqeoCfrMb36nUDH__2c85kZ1dwHGY9ztzWoowaGe63JH4ysIy6ckmHRw0osjuf8nHP1y92rm0H1E9RBGebyikMJSVr5ka7-4MNNel8Mvcoy0Auyn2HzWixiVk9QYDqCkZRUlRf89dcY" 
                 alt="Live Stream" 
                 className={styles.liveBgImage} 
              />
              <div className={styles.playOverlay} onClick={() => setActiveVideo("-YCGK33c0xs")}>
                 <span className="material-symbols-outlined">play_circle</span>
              </div>
           </div>
        </section>

        {/* Course Grid */}
        <section className={styles.coursesSection}>
           <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>Curated Collections</h4>
              <a href="#" className={styles.viewAllLink}>View All Mastery Courses</a>
           </div>
           
           <div className={styles.grid}>
              {NEW_COURSES.map(course => (
                 <div key={course.id} className={styles.courseCard}>
                    <div className={styles.cardThumbWrapper}>
                       <img src={course.thumbnail} alt={course.title} className={styles.cardThumb} />
                       <div className={styles.cardCategory}>{course.category}</div>
                    </div>
                    
                    <div className={styles.cardContent}>
                       <h5 className={styles.cardTitle}>{course.title}</h5>
                       
                       <div className={styles.instructorRow}>
                          <div className={styles.instructorInfo}>
                             <img src={course.instructorAvatar} alt={course.instructor} className={styles.instructorAvatar} />
                             <span>{course.instructor}</span>
                          </div>
                          <div className={styles.ratingInfo}>
                             <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                             {course.rating.toFixed(1)}
                          </div>
                       </div>
                       
                       <div className={styles.cardFooter}>
                          <div className={styles.courseMeta}>
                             <span className={styles.metaInfo}>{course.lessons} Lessons • {course.duration}</span>
                             <span className={styles.coursePrice}>{course.price}</span>
                          </div>
                          <button className={styles.enrollBtn} onClick={() => setActiveVideo(course.youtubeId)}>
                            Enroll Now
                          </button>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* Learning Path Roadmap */}
        <section className={styles.roadmap}>
           <div className={styles.roadmapHeader}>
              <h4 className={styles.roadmapTitle}>The Curator's Roadmap</h4>
              <p className={styles.roadmapSubtitle}>Pottery Mastery Path • Curated for Professionals</p>
           </div>
           
           <div className={styles.roadmapFlow}>
              <div className={styles.flowTrack}></div>
              
              <div className={styles.flowNode}>
                 <div className={`${styles.nodeCircle} ${styles.nodeActive}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                 </div>
                 <div className={styles.nodeText}>
                    <p className={`${styles.nodeStage} ${styles.stageActive}`}>Stage 1</p>
                    <p className={styles.nodeTitle}>Clay Preparation</p>
                 </div>
              </div>
              
              <div className={styles.flowNode}>
                 <div className={`${styles.nodeCircle} ${styles.nodeCurrent}`}>
                    <span className="material-symbols-outlined">architecture</span>
                 </div>
                 <div className={styles.nodeText}>
                    <p className={styles.nodeStage}>Stage 2</p>
                    <p className={styles.nodeTitleActive}>Wheel Basics</p>
                 </div>
              </div>
              
              <div className={styles.flowNode}>
                 <div className={`${styles.nodeCircle} ${styles.nodePending}`}>
                    <span className="material-symbols-outlined">local_fire_department</span>
                 </div>
                 <div className={`${styles.nodeText} ${styles.textPending}`}>
                    <p className={styles.nodeStage}>Stage 3</p>
                    <p className={styles.nodeTitle}>Kiln Mastery</p>
                 </div>
              </div>
              
              <div className={styles.flowNode}>
                 <div className={`${styles.nodeCircle} ${styles.nodePending}`}>
                    <span className="material-symbols-outlined">palette</span>
                 </div>
                 <div className={`${styles.nodeText} ${styles.textPending}`}>
                    <p className={styles.nodeStage}>Stage 4</p>
                    <p className={styles.nodeTitle}>Glazing Art</p>
                 </div>
              </div>
           </div>
           
           <div className={styles.roadmapAction}>
              <button className={styles.resumePathBtn}>Resume Path</button>
           </div>
        </section>

      </div>

      {/* VIDEO OVERLAY */}
      {activeVideo && (
        <div
          className={styles.overlay}
          onClick={() => setActiveVideo(null)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.close}
              onClick={() => setActiveVideo(null)}
            >
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="Course Video"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
