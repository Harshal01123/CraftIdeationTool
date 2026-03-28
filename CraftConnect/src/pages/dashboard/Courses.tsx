import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./Courses.module.css";
import { COURSE_SAVED_EVENT } from "../../layouts/DashboardLayout";

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

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function Courses() {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteRequest = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setCourseToDelete(course);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseToDelete.id);
      if (error) throw error;
      setCourseToDelete(null);
      fetchCourses();
    } catch (err: any) {
      console.error("Error deleting course:", err.message);
      alert("Failed to delete course: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setCurrentUserId(data.session.user.id);
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

  // Group courses by category
  const categories = ["Pottery", "Bamboo", "Glass", "Tiles", "Handloom", "Painting"];
  const groupedCourses = categories.map(cat => ({
    name: cat,
    courses: courses.filter(c => c.category === cat)
  }));

  return (
    <div className={styles.page}>
      {/* Grain Overlay */}
      <div className={styles.grainOverlay}></div>

      <div className={styles.contentWrap}>
        
        {/* Categories Grid */}
        <div className={styles.categoriesContainer}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem", color: "var(--outline)" }}>
              Loading courses...
            </div>
          ) : (
            groupedCourses.map((category) => {
              const matchedCourses = category.courses.filter(course => {
                if (!searchQuery) return true;
                return course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       course.artisan?.name?.toLowerCase().includes(searchQuery.toLowerCase());
              });

              if (matchedCourses.length === 0) return null;

              const hindiTranslations: Record<string, string> = {
                "Pottery": "कुम्हार",
                "Bamboo": "बांस",
                "Glass": "कांच",
                "Tiles": "टाइलें",
                "Handloom": "हथकरघा",
                "Painting": "चित्रकारी"
              };
              const hindiName = hindiTranslations[category.name] || "";

              return (
                <section key={category.name} className={styles.categorySection}>
                  <div className={styles.categoryHeader}>
                    <h3 className={styles.categoryTitle}>{category.name}</h3>
                    {hindiName && <span className={styles.hindiAccent}>{hindiName}</span>}
                  </div>
                  
                  <div className={styles.courseGrid}>
                    {matchedCourses.map(course => (
                      <div 
                        key={course.id} 
                        className={styles.courseCard}
                        onClick={() => {
                          if (course.videos && course.videos.length > 0) {
                            setActiveVideo(course.videos[0].youtube_id);
                          }
                        }}
                      >
                        <div className={styles.imageWrapper}>
                           <img src={course.thumbnail} alt={course.title} className={styles.courseImage}/>
                           <div className={styles.levelBadge}>{course.level}</div>
                           {currentUserId === course.artisan?.id && (
                             <button 
                               onClick={(e) => handleDeleteRequest(course, e)}
                               className={styles.deleteBtn}
                               title="Delete Course"
                             >
                               <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete</span>
                             </button>
                           )}
                        </div>
                        
                        <div className={styles.courseContent}>
                          <h4 className={styles.courseTitle}>{course.title}</h4>
                          <p className={styles.courseInstructor}>
                            Instructor: {course.artisan?.name || "Unknown Artisan"}
                          </p>
                          <div className={styles.courseFooter}>
                            <span className={styles.courseDuration}>
                              <span className="material-symbols-outlined">schedule</span> 
                              {formatDuration(course.duration_minutes)}
                            </span>
                            <button className={styles.viewCourseBtn}>View Course</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
          
          {!loading && courses.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem", color: "var(--outline)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", marginBottom: "1rem" }}>{fetchError ? 'error' : 'school'}</span>
              {fetchError ? (
                <div style={{ color: "red", marginTop: "1rem" }}>
                  <strong>Database Error:</strong> {fetchError}
                  <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>Check your browser console for more details.</p>
                </div>
              ) : (
                <p>No master classes available yet. Artisans can create new courses from their dashboard.</p>
              )}
            </div>
          )}
        </div>
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
            style={{ position: 'relative', width: '90%', maxWidth: '900px', aspectRatio: '16/9', background: '#000' }}
          >
            <button
              className={styles.close}
              onClick={() => setActiveVideo(null)}
              style={{ position: 'absolute', top: '-2rem', right: '-2rem', background: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 100 }}
            >
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="Course Video"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <div className={styles.popupOverlay} onClick={() => !isDeleting && setCourseToDelete(null)}>
          <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined" style={{ fontSize: "3.5rem", color: "#d32f2f" }}>warning</span>
            <h3>Delete Course?</h3>
            <p>
              Are you sure you want to delete <strong>{courseToDelete.title}</strong>? This action cannot be undone and will permanently remove it from your offerings.
            </p>
            <div className={styles.popupActions}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setCourseToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteConfirmBtn} 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
