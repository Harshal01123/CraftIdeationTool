import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useMode } from "../../contexts/ModeContext";
import Spinner from "../../components/Spinner";
import styles from "./CoursePortfolio.module.css";

interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

interface Video {
  title: string;
  description?: string;
  thumbnail?: string;
  duration_minutes: number;
  youtube_id: string;
}

interface Course {
  id: string;
  category: string;
  title: string;
  level: string;
  description: string;
  duration_minutes: number;
  thumbnail: string;
  videos: Video[];
  artisan: Profile;
  artisan_id: string;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function CoursePortfolio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeMode } = useMode();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          artisan:profiles!artisan_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq("id", id)
        .single();
        
      if (error) {
        console.error("Error fetching course:", error);
      } else {
        setCourse(data as unknown as Course);
      }
      setLoading(false);
    }
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading course portfolio..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.notFound}>
        <h2>Course not found</h2>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard/courses")}>
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Editorial Grain Overlay */}
      <div className={styles.grainOverlay}></div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <button className={styles.backLink} onClick={() => navigate("/dashboard/courses")}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Master Classes
        </button>

        <div className={styles.heroLayout}>
          <div className={styles.heroContent}>
            <div className={styles.metadataRow}>
              <span className={styles.badge}>{course.category}</span>
              <span className={styles.badgeLabel}>{course.level}</span>
            </div>
            <h1 className={styles.title}>{course.title}</h1>
            
            <p className={styles.description}>
              {course.description || "A deep dive into traditional craftsmanship techniques passed down through generations. Explore the tools, materials, and methods of the masters."}
            </p>

            <div className={styles.artisanInfo}>
              <div className={styles.avatarBox}>
                {course.artisan?.avatar_url ? (
                  <img src={course.artisan.avatar_url} alt={course.artisan.name} />
                ) : (
                  <span className="material-symbols-outlined">person</span>
                )}
              </div>
              <div className={styles.artisanText}>
                <span className={styles.instructorLabel}>Master Artisan</span>
                <span className={styles.artisanName}>{course.artisan?.name || "Unknown"}</span>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.thumbnailWrapper}>
              <img 
                src={course.thumbnail || (course.videos?.[0]?.youtube_id ? `https://img.youtube.com/vi/${course.videos[0].youtube_id}/hqdefault.jpg` : `https://images.unsplash.com/photo-1549445100-d66ffb7e4f1a?auto=format&fit=crop&q=80&w=800`)} 
                alt={course.title} 
                className={styles.heroThumbnail}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549445100-d66ffb7e4f1a?auto=format&fit=crop&q=80&w=800'; }}
              />
              
              <div className={styles.enrollmentCard}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">schedule</span>
                  <span>{formatDuration(course.duration_minutes)} Total</span>
                </div>
                <div className={styles.cardBody}>
                  <span>{course.videos?.length || 0} Modules</span>
                </div>
                {activeMode !== "artisan" && (
                  <button className={styles.enrollBtn}>
                    Enroll Now
                  </button>
                )}
                {activeMode === "artisan" && course.artisan_id === profile?.id && (
                  <button className={styles.editBtn}>
                     Manage Course
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section className={styles.curriculumSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Curriculum</h2>
          <span className={styles.hindiAccent}>पाठ्यक्रम</span>
        </div>

        <div className={styles.modulesList}>
          {course.videos?.map((video, index) => (
            <div key={index} className={styles.moduleItem} onClick={() => setActiveVideo(video.youtube_id)}>
              {/* Thumbnail */}
              {(video.thumbnail || video.youtube_id) && (
                <img
                  src={video.thumbnail || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
                  alt={video.title}
                  className={styles.moduleThumbnail}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className={styles.moduleTextLayout}>
                <div className={styles.moduleLeft}>
                  <span className={styles.moduleNumber}>{(index + 1).toString().padStart(2, '0')}</span>
                  <h3 className={styles.moduleTitle}>{video.title}</h3>
                </div>
                {video.description && (
                  <p className={styles.moduleDescription}>{video.description}</p>
                )}
              </div>
              <div className={styles.moduleRight}>
                <span className={styles.moduleDuration}>{formatDuration(video.duration_minutes)}</span>
                <button className={styles.playBtn} title="Play Video">
                  <span className="material-symbols-outlined">play_circle</span>
                </button>
              </div>
            </div>
          ))}

          {(!course.videos || course.videos.length === 0) && (
            <p className={styles.emptyCurriculum}>Modules are currently being uploaded.</p>
          )}
        </div>
      </section>

      {/* VIDEO OVERLAY */}
      {activeVideo && (
        <div className={styles.videoOverlay} onClick={() => setActiveVideo(null)}>
          <div className={styles.videoModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeVideoBtn} onClick={() => setActiveVideo(null)}>
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
