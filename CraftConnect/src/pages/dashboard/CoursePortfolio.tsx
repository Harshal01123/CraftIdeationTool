import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useMode } from "../../contexts/ModeContext";
import Spinner from "../../components/Spinner";
import styles from "./CoursePortfolio.module.css";
import { OPEN_EDIT_COURSE_MODAL_EVENT } from "./MyCourses";
import { COURSE_SAVED_EVENT } from "../../layouts/DashboardLayout";

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

/** Extract a bare YouTube video ID from a URL or raw ID string */
function extractYouTubeID(input: string): string {
  if (!input) return "";
  // Already a bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  // youtu.be/ID
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=ID
  const longMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // youtube.com/embed/ID
  const embedMatch = input.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return "";
}

/** Returns true when the stored youtube_id is actually a Supabase storage URL */
function isNativeVideo(youtubeId: string): boolean {
  return youtubeId?.startsWith("http") && youtubeId.includes("supabase");
}

interface ActiveVideo { src: string; type: "youtube" | "native"; }

export default function CoursePortfolio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeMode } = useMode();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);

  function openVideo(youtubeIdOrUrl: string) {
    if (!youtubeIdOrUrl) return;
    if (isNativeVideo(youtubeIdOrUrl)) {
      setActiveVideo({ src: youtubeIdOrUrl, type: "native" });
    } else {
      const ytId = extractYouTubeID(youtubeIdOrUrl);
      if (ytId) setActiveVideo({ src: ytId, type: "youtube" });
    }
  }

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

    window.addEventListener(COURSE_SAVED_EVENT, fetchCourse);
    return () => window.removeEventListener(COURSE_SAVED_EVENT, fetchCourse);
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

  const isOwner = activeMode === "artisan" && course.artisan_id === profile?.id;
  const totalVideos = course.videos?.length ?? 0;

  // Split title at ":" for editorial italics treatment
  const colonIdx = course.title.indexOf(":");
  const titleMain = colonIdx > -1 ? course.title.slice(0, colonIdx + 1) : course.title;
  const titleSub  = colonIdx > -1 ? course.title.slice(colonIdx + 1).trim() : "";

  function handleManageCourse() {
    window.dispatchEvent(
      new CustomEvent(OPEN_EDIT_COURSE_MODAL_EVENT, { detail: { course } })
    );
  }

  return (
    <div className={styles.page}>
      {/* Grain overlay */}
      <div className={styles.grainOverlay} />

      <div className={styles.canvas}>
        {/* Back link */}
        <button className={styles.backLink} onClick={() => navigate("/dashboard/courses")}>
          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>arrow_back</span>
          Back to Masterclasses
        </button>

        {/* ── Hero Section ── */}
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            {/* Left: title + description */}
            <div className={styles.heroLeft}>
              <div className={styles.badgeRow}>
                <span className={styles.badgeCategory}>{course.category}</span>
                <span className={styles.badgeLevel}>{course.level}</span>
              </div>

              <h1 className={styles.heroTitle}>
                {titleMain}
                {titleSub && (
                  <>
                    <br />
                    <span className={styles.heroTitleItalic}>{titleSub}</span>
                  </>
                )}
              </h1>

              <p className={styles.heroDescription}>
                {course.description ||
                  "A deep dive into traditional craftsmanship techniques passed down through generations. Explore the tools, materials, and methods of the masters."}
              </p>
            </div>

            {/* Right: artisan photo + info + stats */}
            <div className={styles.heroRight}>
              {/* Artisan Avatar */}
              <div className={styles.artisanAvatarWrap}>
                {course.artisan?.avatar_url ? (
                  <img
                    src={course.artisan.avatar_url}
                    alt={course.artisan.name}
                    className={styles.artisanAvatar}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className={styles.artisanAvatarFallback}>
                    <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--outline)" }}>
                      person
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.artisanBlock}>
                <span className={styles.artisanLabel}>Master Artisan</span>
                <span className={styles.artisanName}>{course.artisan?.name || "Unknown"}</span>
                <span className={styles.artisanHindi}>मास्टर शिल्पकार</span>
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Lessons</span>
                  <span className={styles.statValue}>{totalVideos} Lessons</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Duration</span>
                  <span className={styles.statValue}>{formatDuration(course.duration_minutes)} Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className={styles.heroActions}>
            {!isOwner && (
              <button className={styles.enrollBtn}>Enroll Now</button>
            )}
            {isOwner && (
              <button className={styles.manageBtn} onClick={handleManageCourse}>
                Manage Course
              </button>
            )}
          </div>
        </section>

        {/* ── Curriculum Section ── */}
        <section className={styles.curriculumSection}>
          {/* Section header with rule */}
          <div className={styles.curriculumHeader}>
            <h2 className={styles.curriculumTitle}>Curriculum</h2>
            <div className={styles.curriculumRule} />
          </div>

          {/* Module List — one row per video */}
          <div className={styles.moduleList}>
            {course.videos?.map((video, idx) => {
              const native = isNativeVideo(video.youtube_id);
              // For YouTube use auto-generated thumbnail; for native use stored thumbnail
              const thumbSrc =
                video.thumbnail ||
                (!native && video.youtube_id
                  ? `https://img.youtube.com/vi/${extractYouTubeID(video.youtube_id)}/hqdefault.jpg`
                  : "");

              return (
                <div key={idx} className={styles.moduleRow}>
                  {/* Left: thumbnail */}
                  <div className={styles.moduleThumbWrap}>
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt={video.title}
                        className={styles.moduleThumb}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400";
                        }}
                      />
                    ) : (
                      <div className={styles.modulePlaceholderImg}>
                        <span className="material-symbols-outlined">movie</span>
                      </div>
                    )}
                  </div>

                  {/* Middle: text */}
                  <div className={styles.moduleRowContent}>
                    <span className={styles.moduleNumber}>
                      Module {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h4 className={styles.moduleTitle}>{video.title}</h4>
                    {video.description && (
                      <p className={styles.moduleDesc}>{video.description}</p>
                    )}
                    {video.duration_minutes > 0 && (
                      <div className={styles.moduleFooter}>
                        <span className="material-symbols-outlined">schedule</span>
                        <span className={styles.moduleFooterLabel}>
                          {formatDuration(video.duration_minutes)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: play button */}
                  <button
                    className={styles.modulePlayBtn}
                    title="Play Video"
                    disabled={!video.youtube_id}
                    onClick={() => openVideo(video.youtube_id)}
                  >
                    <span className="material-symbols-outlined">play_circle</span>
                  </button>
                </div>
              );
            })}

            {(!course.videos || course.videos.length === 0) && (
              <p className={styles.emptyCurriculum}>
                Modules are currently being uploaded. Check back soon.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ── Video Overlay ── */}
      {activeVideo && (
        <div className={styles.videoOverlay} onClick={() => setActiveVideo(null)}>
          <div className={styles.videoModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeVideoBtn} onClick={() => setActiveVideo(null)}>
              ✕
            </button>
            {activeVideo.type === "youtube" ? (
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.src}?autoplay=1&rel=0`}
                title="Course Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={activeVideo.src}
                controls
                autoPlay
                style={{ width: "100%", height: "100%", borderRadius: "8px", background: "#000" }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
