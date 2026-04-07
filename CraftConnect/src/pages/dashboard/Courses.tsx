import { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./Courses.module.css";
import { COURSE_SAVED_EVENT } from "../../layouts/DashboardLayout";
import Spinner from "../../components/Spinner";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useMode } from "../../contexts/ModeContext";
import { INDUSTRY_OPTIONS } from "../../constants/industryOptions";

interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

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
  thumbnail: string;
  videos: Video[];
  artisan: Profile;
}

function formatDuration(minutes: number, t: any) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}${t("extended.minsShort")}`;
  if (m === 0) return `${h}${t("extended.hoursShort")}`;
  return `${h}${t("extended.hoursShort")} ${m}${t("extended.minsShort")}`;
}

export default function Courses() {
  const { t } = useTranslation();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const { profile } = useAuth();
  const { activeMode } = useMode();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const COURSES_PER_ROW = 6;

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  const fetchCourses = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          artisan:profiles (
            id,
            name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      console.log("Fetched courses:", data);
      setCourses(data as unknown as Course[]);
    } catch (err: any) {
      console.error("Error fetching courses:", err.message);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // User is logged in
      }
    });

    fetchCourses();

    const handleCourseSaved = () => {
      fetchCourses();
    };

    window.addEventListener(COURSE_SAVED_EVENT, handleCourseSaved);
    return () => {
      window.removeEventListener(COURSE_SAVED_EVENT, handleCourseSaved);
    };
  }, []);

  // Filter out artisan's own courses in learner mode
  const visibleAllCourses = useMemo(() => (
    (activeMode === "learner" && profile?.role === "artisan")
      ? courses.filter((c) => c.artisan?.id !== profile.id)
      : courses
  ), [courses, activeMode, profile]);

  // Dynamically derive categories from what's actually in the DB
  const groupedCourses = useMemo(() => {
    // Only include categories present in fetched data, sorted by INDUSTRY_OPTIONS order
    const presentCats = Array.from(new Set(visibleAllCourses.map(c => c.category).filter(Boolean)));
    const orderedCats = [
      ...INDUSTRY_OPTIONS.filter(opt => presentCats.includes(opt)),
      ...presentCats.filter(cat => !INDUSTRY_OPTIONS.includes(cat as any)),
    ];
    return orderedCats.map(cat => ({
      name: cat,
      courses: visibleAllCourses.filter(c => c.category === cat),
    }));
  }, [visibleAllCourses]);

  return (
    <div className={styles.page}>
      {/* Grain Overlay */}
      <div className={styles.grainOverlay}></div>

      <div className={styles.contentWrap}>
        
        {/* Categories Grid */}
        <div className={styles.categoriesContainer}>
          {loading ? (
            <Spinner size="lg" label={t("extended.loadingCourses")} />
          ) : (
            groupedCourses.map((category) => {
              const matchedCourses = category.courses.filter(course => {
                if (!searchQuery) return true;
                return course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       course.artisan?.name?.toLowerCase().includes(searchQuery.toLowerCase());
              });

              if (matchedCourses.length === 0) return null;

              const hindiName = t(`industry.${category.name}`, "") !== category.name
                ? t(`industry.${category.name}`, "")
                : "";

              const isExpanded = expandedCategories[category.name] || false;
              const visibleCourses = isExpanded ? matchedCourses : matchedCourses.slice(0, COURSES_PER_ROW);
              const hasMore = matchedCourses.length > COURSES_PER_ROW;

              return (
                <section key={category.name} className={styles.categorySection}>
                  <div className={styles.categoryHeader}>
                    <div className={styles.categoryTitleGroup}>
                      <h3 className={styles.categoryTitle}>{category.name}</h3>
                      {hindiName && <span className={styles.hindiAccent}>{hindiName}</span>}
                    </div>
                    {hasMore && (
                      <button
                        className={styles.viewAllBtn}
                        onClick={() => toggleCategory(category.name)}
                      >
                        {isExpanded ? (
                          <><span className="material-symbols-outlined">expand_less</span> {t("extended.showLess")}</>
                        ) : (
                          <><span className="material-symbols-outlined">expand_more</span> {t("extended.viewAll")} ({matchedCourses.length})</>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className={styles.courseGrid}>
                    {visibleCourses.map(course => (
                      <div 
                        key={course.id} 
                        className={styles.courseCard}
                        onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                      >
                        <div className={styles.imageWrapper}>
                           <img 
                             src={course.thumbnail || (course.videos?.[0]?.youtube_id ? `https://img.youtube.com/vi/${course.videos[0].youtube_id}/hqdefault.jpg` : `https://images.unsplash.com/photo-1549445100-d66ffb7e4f1a?auto=format&fit=crop&q=80&w=800`)} 
                             alt={course.title} 
                             className={styles.courseImage}
                             onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549445100-d66ffb7e4f1a?auto=format&fit=crop&q=80&w=800'; }}
                           />
                           <div className={styles.levelBadge}>{course.level}</div>
                        </div>
                        
                        <div className={styles.courseContent}>
                          <h4 className={styles.courseTitle}>{course.title}</h4>
                          <p className={styles.courseInstructor}>
                            {t("extended.instructor", "Instructor")}: {course.artisan?.name || t("extended.unknown")}
                          </p>
                          <div className={styles.courseFooter}>
                            <span className={styles.courseDuration}>
                              <span className="material-symbols-outlined">schedule</span> 
                              {formatDuration(course.duration_minutes, t)}
                            </span>
                            <button className={styles.viewCourseBtn}>{t("extended.viewCourse", "View Course")}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
          
          {!loading && visibleAllCourses.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem", color: "var(--outline)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", marginBottom: "1rem" }}>{fetchError ? 'error' : 'school'}</span>
              {fetchError ? (
                <div style={{ color: "red", marginTop: "1rem" }}>
                  <strong>Database Error:</strong> {fetchError}
                  <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>Check your browser console for more details.</p>
                </div>
              ) : (
                <p>{t("extended.emptyCourses")}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
