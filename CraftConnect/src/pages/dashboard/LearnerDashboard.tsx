import { useAuth } from "../../hooks/useAuth";
import styles from "./Dashboard.module.css";

function LearnerDashboard() {
  const { profile } = useAuth();
  return (
    <section className={styles.hero}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
        </div>
      </header>
      <div className={styles.welcomeBanner} style={{ backgroundColor: "var(--tertiary)" }}>
        <div className={styles.welcomeContent}>
          <span className={styles.workspaceTag}>Learner Workspace</span>
          <h3 className={styles.welcomeName}>Namaste, {profile?.name?.split(" ")[0] || "Learner"}</h3>
          <p className={styles.welcomeText}>Continue your journey through India's rich cultural heritage.</p>
        </div>
        <div className={styles.welcomeIcon}>
          <span className="material-symbols-outlined" style={{ fontSize: "inherit" }}>school</span>
        </div>
      </div>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>verified</span>
            </div>
          </div>
          <p className={styles.kpiValue}>0</p>
          <p className={styles.kpiLabel}>Certificates</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>menu_book</span>
            </div>
          </div>
          <p className={styles.kpiValue}>0</p>
          <p className={styles.kpiLabel}>Enrolled Courses</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>done_all</span>
            </div>
          </div>
          <p className={styles.kpiValue}>0</p>
          <p className={styles.kpiLabel}>Completed Courses</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}>
              <span className={`material-symbols-outlined ${styles.kpiIcon}`}>local_fire_department</span>
            </div>
          </div>
          <p className={styles.kpiValue}>0</p>
          <p className={styles.kpiLabel}>Streak Days</p>
        </div>
      </div>
    </section>
  );
}

export default LearnerDashboard;
