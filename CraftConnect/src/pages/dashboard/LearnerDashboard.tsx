import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import styles from "./Dashboard.module.css";

function LearnerDashboard() {
  const { profile } = useAuth();
  const [enrolled, setEnrolled] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [certs, setCerts] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    const uid = profile.id;
    async function fetchStats() {
      const [
        { count: enrolledCount },
        { count: completedCount },
        { count: certsCount },
        { data: streakRow },
      ] = await Promise.all([
        supabase.from("course_enrollments").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("course_completions").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("learning_streaks").select("streak_days").eq("user_id", uid).maybeSingle(),
      ]);
      setEnrolled(enrolledCount ?? 0);
      setCompleted(completedCount ?? 0);
      setCerts(certsCount ?? 0);
      setStreak((streakRow as any)?.streak_days ?? 0);
    }
    fetchStats();
  }, [profile?.id]);

  return (
    <section className={styles.hero}>
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
          <div className={styles.kpiHeader}><div className={styles.kpiIconBox}><span className={`material-symbols-outlined ${styles.kpiIcon}`}>verified</span></div></div>
          <p className={styles.kpiValue}>{certs}</p>
          <p className={styles.kpiLabel}>Certificates</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><div className={styles.kpiIconBox}><span className={`material-symbols-outlined ${styles.kpiIcon}`}>menu_book</span></div></div>
          <p className={styles.kpiValue}>{enrolled}</p>
          <p className={styles.kpiLabel}>Enrolled Courses</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><div className={styles.kpiIconBox}><span className={`material-symbols-outlined ${styles.kpiIcon}`}>done_all</span></div></div>
          <p className={styles.kpiValue}>{completed}</p>
          <p className={styles.kpiLabel}>Completed Courses</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><div className={styles.kpiIconBox}><span className={`material-symbols-outlined ${styles.kpiIcon}`}>local_fire_department</span></div></div>
          <p className={styles.kpiValue}>{streak}</p>
          <p className={styles.kpiLabel}>Streak Days</p>
        </div>
      </div>
    </section>
  );
}

export default LearnerDashboard;

