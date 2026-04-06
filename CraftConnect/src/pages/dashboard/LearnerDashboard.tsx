import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import styles from "./Dashboard.module.css";

interface InProgressCourse {
  id: string;
  title: string;
  category: string;
  level: string;
  thumbnail: string | null;
  videos: { title: string }[];
  completedCount: number;
}

function LearnerDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [certs, setCerts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [inProgress, setInProgress] = useState<InProgressCourse[]>([]);

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

    async function fetchInProgress() {
      // Get all enrolled course IDs
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", uid);
      if (!enrollments?.length) return;

      // Get completed course IDs
      const { data: completions } = await supabase
        .from("course_completions")
        .select("course_id")
        .eq("user_id", uid);
      const completedIds = new Set((completions ?? []).map((c: any) => c.course_id));

      // Filter to in-progress only
      const inProgressIds = enrollments
        .map((e: any) => e.course_id)
        .filter((id: string) => !completedIds.has(id));
      if (!inProgressIds.length) return;

      // Fetch course details
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, category, level, thumbnail, videos")
        .in("id", inProgressIds)
        .limit(4);

      // Fetch video progress counts for each course
      const progressPromises = (courses ?? []).map((c: any) =>
        supabase
          .from("course_video_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("course_id", c.id)
          .then(({ count }) => ({ courseId: c.id, count: count ?? 0 }))
      );
      const progressResults = await Promise.all(progressPromises);
      const progressMap: Record<string, number> = {};
      progressResults.forEach(({ courseId, count }) => { progressMap[courseId] = count; });

      setInProgress(
        (courses ?? []).map((c: any) => ({
          ...c,
          completedCount: progressMap[c.id] ?? 0,
        }))
      );
    }

    fetchStats();
    fetchInProgress();
  }, [profile?.id]);

  return (
    <section className={styles.hero}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner} style={{ backgroundColor: "var(--tertiary)" }}>
        <div className={styles.welcomeContent}>
          <span className={styles.workspaceTag}>{t("learnerDashboard.workspace")}</span>
          <h3 className={styles.welcomeName}>{t("learnerDashboard.namaste")}, {profile?.name?.split(" ")[0] || t("learnerDashboard.learner")}</h3>
          <p className={styles.welcomeText}>{t("learnerDashboard.welcomeText")}</p>
        </div>
        <div className={styles.welcomeIcon}>
          <span className="material-symbols-outlined" style={{ fontSize: "inherit" }}>school</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><div className={styles.kpiIconBox}><span className={`material-symbols-outlined ${styles.kpiIcon}`}>verified</span></div></div>
          <p className={styles.kpiValue}>{certs}</p>
          <p className={styles.kpiLabel}>{t("learnerDashboard.certificates")}</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><div className={styles.kpiIconBox}><span className={`material-symbols-outlined ${styles.kpiIcon}`}>menu_book</span></div></div>
          <p className={styles.kpiValue}>{enrolled}</p>
          <p className={styles.kpiLabel}>{t("learnerDashboard.enrolledCourses")}</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><div className={styles.kpiIconBox}><span className={`material-symbols-outlined ${styles.kpiIcon}`}>done_all</span></div></div>
          <p className={styles.kpiValue}>{completed}</p>
          <p className={styles.kpiLabel}>{t("learnerDashboard.completedCourses")}</p>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><div className={styles.kpiIconBox}><span className={`material-symbols-outlined ${styles.kpiIcon}`}>local_fire_department</span></div></div>
          <p className={styles.kpiValue}>{streak}</p>
          <p className={styles.kpiLabel}>{t("learnerDashboard.streakDays")}</p>
        </div>
      </div>

      {/* Continue Learning */}
      {inProgress.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{t("learnerDashboard.continueLearning")}</h3>
            <button className={styles.viewAllBtn} onClick={() => navigate("/dashboard/courses")}>
              {t("learnerDashboard.browseAll")}
            </button>
          </div>
          <div className={styles.coursesList}>
            {inProgress.map((c) => {
              const total = c.videos?.length ?? 0;
              const pct = total > 0 ? Math.round((c.completedCount / total) * 100) : 0;
              return (
                <div
                  key={c.id}
                  className={styles.courseListItem}
                  onClick={() => navigate(`/dashboard/courses/${c.id}`)}
                >
                  {/* Thumbnail */}
                  <div className={styles.courseListThumb}>
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.title} className={styles.courseListImg} />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: "1.5rem", color: "var(--outline-variant)" }}>play_circle</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className={styles.courseListBody} style={{ flex: 1 }}>
                    <p className={styles.courseListTitle}>{c.title}</p>
                    <div className={styles.courseListMeta}>
                      <span className={styles.courseListLevel}>{c.level}</span>
                      <span className={styles.courseListVideos}>{c.completedCount}/{total} {t("learnerDashboard.lessons")}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: "0.5rem", height: "4px", background: "var(--outline-variant)", borderRadius: "9999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "var(--primary)", borderRadius: "9999px", transition: "width 0.4s" }} />
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/courses/${c.id}`); }}
                    style={{
                      flexShrink: 0,
                      padding: "0.5rem 1rem",
                      background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontFamily: "var(--font-label)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Continue →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default LearnerDashboard;
