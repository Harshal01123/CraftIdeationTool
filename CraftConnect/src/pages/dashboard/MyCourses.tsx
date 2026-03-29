import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Spinner from "../../components/Spinner";
import { COURSE_SAVED_EVENT } from "../../layouts/DashboardLayout";
import styles from "./Courses.module.css";

interface Video {
  title: string;
  duration_minutes: number;
  youtube_id: string;
}

interface Course {
  id: string;
  category: string;
  title: string;
  level: string;
  duration_minutes: number;
  thumbnail: string | null;
  videos: Video[];
}

export const OPEN_EDIT_COURSE_MODAL_EVENT = "dashboard:open-edit-course-modal";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function MyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCourses(uid: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, category, description, level, thumbnail, duration_minutes, videos")
      .eq("artisan_id", uid)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching courses:", error);
    setCourses((data as Course[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        fetchCourses(data.session.user.id);
      }
    });

    function handleCourseSaved() {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) fetchCourses(data.session.user.id);
      });
    }
    window.addEventListener(COURSE_SAVED_EVENT, handleCourseSaved);
    return () => window.removeEventListener(COURSE_SAVED_EVENT, handleCourseSaved);
  }, []);

  const hindiTranslations: Record<string, string> = {
    Pottery: "कुम्हार", Bamboo: "बांस", Glass: "कांच",
    Tiles: "टाइलें", Handloom: "हथकरघा", Painting: "चित्रकारी",
  };

  const categories = ["Pottery", "Bamboo", "Glass", "Tiles", "Handloom", "Painting"];
  const groupedCourses = categories
    .map((cat) => ({ name: cat, courses: courses.filter((c) => c.category === cat) }))
    .filter((g) => g.courses.length > 0);

  return (
    <div className={styles.page}>
      <div className={styles.grainOverlay}></div>
      <div className={styles.contentWrap}>

        {loading ? (
          <Spinner size="lg" label="Loading your courses..." />
        ) : courses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--outline)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "3rem" }}>school</span>
            <p>No courses yet. Use "New Course" to create one.</p>
          </div>
        ) : (
          <div className={styles.categoriesContainer}>
            {groupedCourses.map((group) => (
              <section key={group.name} className={styles.categorySection}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryTitleGroup}>
                    <h3 className={styles.categoryTitle}>{group.name}</h3>
                    {hindiTranslations[group.name] && (
                      <span className={styles.hindiAccent}>{hindiTranslations[group.name]}</span>
                    )}
                  </div>
                </div>
                <div className={styles.courseGrid}>
                  {group.courses.map((course) => (
                    <div
                      key={course.id}
                      className={styles.courseCard}
                      onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                    >
                      <div className={styles.imageWrapper}>
                        <img
                          src={
                            course.thumbnail ||
                            (course.videos?.[0]?.youtube_id
                              ? `https://img.youtube.com/vi/${course.videos[0].youtube_id}/hqdefault.jpg`
                              : `https://images.unsplash.com/photo-1549445100-d66ffb7e4f1a?auto=format&fit=crop&q=80&w=800`)
                          }
                          alt={course.title}
                          className={styles.courseImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1549445100-d66ffb7e4f1a?auto=format&fit=crop&q=80&w=800";
                          }}
                        />
                        <div className={styles.levelBadge}>{course.level}</div>
                      </div>
                      <div className={styles.courseContent}>
                        <h4 className={styles.courseTitle}>{course.title}</h4>
                        <div className={styles.courseFooter}>
                          <span className={styles.courseDuration}>
                            <span className="material-symbols-outlined">schedule</span>{" "}
                            {formatDuration(course.duration_minutes)}
                          </span>
                          <button className={styles.viewCourseBtn}>Manage</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCourses;
