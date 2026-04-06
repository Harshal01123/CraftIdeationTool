import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useMode } from "../../contexts/ModeContext";
import Spinner from "../../components/Spinner";
import CertificateModal from "../../components/courses/CertificateModal";
import styles from "./CoursePortfolio.module.css";
import { OPEN_EDIT_COURSE_MODAL_EVENT } from "./MyCourses";
import { COURSE_SAVED_EVENT } from "../../layouts/DashboardLayout";
import { useTranslation } from "react-i18next";

// ── Types ─────────────────────────────────────────────────────────
interface Profile { id: string; name: string; avatar_url: string; }

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

interface EnrolledUser {
  id: string;
  name: string;
  avatar_url: string;
  enrolled_at: string;
}

interface CertData {
  learnerName: string;
  courseTitle: string;
  artisanName: string;
  issuedAt: string;
  certificateCode: string;
}

// ── Helpers ───────────────────────────────────────────────────────
function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function extractYouTubeID(input: string): string {
  if (!input) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const longMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  const embedMatch = input.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return "";
}

function isNativeVideo(youtubeId: string): boolean {
  return youtubeId?.startsWith("http") && youtubeId.includes("supabase");
}

function generateCertCode(category: string): string {
  const prefix = (category ?? "CC").slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CC-${prefix}-${year}-${rand}`;
}

// ── Streak updater (pure async, no state side effects) ────────────
async function updateStreak(userId: string) {
  const todayUTC = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const { data: row } = await supabase
    .from("learning_streaks")
    .select("streak_days, last_watched")
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) {
    await supabase.from("learning_streaks").insert({ user_id: userId, streak_days: 1, last_watched: todayUTC });
    return;
  }
  if (row.last_watched === todayUTC) return; // already watched today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = row.last_watched === yesterday ? row.streak_days + 1 : 1;
  await supabase.from("learning_streaks").update({ streak_days: newStreak, last_watched: todayUTC }).eq("user_id", userId);
}

interface ActiveVideo { src: string; type: "youtube" | "native"; videoIndex: number; }

// ── Component ─────────────────────────────────────────────────────
export default function CoursePortfolio() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeMode } = useMode();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Enrollment
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollCount, setEnrollCount] = useState(0);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [showEnrollToast, setShowEnrollToast] = useState(false);

  // Artisan enrolled-users panel
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([]);
  const [showEnrolledPanel, setShowEnrolledPanel] = useState(false);

  // Video progress: set of completed video indices
  const [completedVideos, setCompletedVideos] = useState<Set<number>>(new Set());
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);

  // Certificate
  const [certData, setCertData] = useState<CertData | null>(null);
  const [showCert, setShowCert] = useState(false);

  // YouTube IFrame API player ref & ready flag
  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const ytApiLoadedRef = useRef(false);

  // ── fetch enrollment data ──────────────────────────────────────
  const fetchEnrollmentData = useCallback(async (courseId: string, isOwnerFlag: boolean) => {
    const { count } = await supabase
      .from("course_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId);
    setEnrollCount(count ?? 0);

    if (profile?.id) {
      const { data: myEnrollment } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", profile.id)
        .maybeSingle();
      setIsEnrolled(!!myEnrollment);

      // Fetch completed video indices
      const { data: progressRows } = await supabase
        .from("course_video_progress")
        .select("video_index")
        .eq("course_id", courseId)
        .eq("user_id", profile.id);
      const doneSet = new Set<number>((progressRows ?? []).map((r: any) => r.video_index));
      setCompletedVideos(doneSet);

      // Check course completion
      const { data: completionRow } = await supabase
        .from("course_completions")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", profile.id)
        .maybeSingle();
      setIsCourseCompleted(!!completionRow);
    }

    if (isOwnerFlag && profile?.id) {
      const { data: rows } = await supabase
        .from("course_enrollments")
        .select("enrolled_at, user:profiles!user_id(id, name, avatar_url)")
        .eq("course_id", courseId)
        .order("enrolled_at", { ascending: false });
      if (rows) {
        setEnrolledUsers(rows.map((r: any) => ({
          id: r.user.id, name: r.user.name, avatar_url: r.user.avatar_url, enrolled_at: r.enrolled_at,
        })));
      }
    }
  }, [profile?.id]);

  // ── fetch course ───────────────────────────────────────────────
  useEffect(() => {
    async function fetchCourse() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select(`*, artisan:profiles!artisan_id(id, name, avatar_url)`)
        .eq("id", id)
        .single();
      if (error) { console.error(error); }
      else {
        const fetched = data as unknown as Course;
        setCourse(fetched);
        const ownerFlag = activeMode === "artisan" && fetched.artisan_id === profile?.id;
        await fetchEnrollmentData(fetched.id, ownerFlag);
      }
      setLoading(false);
    }
    fetchCourse();
    window.addEventListener(COURSE_SAVED_EVENT, fetchCourse);
    return () => window.removeEventListener(COURSE_SAVED_EVENT, fetchCourse);
  }, [id, profile?.id, activeMode, fetchEnrollmentData]);

  // ── Load YouTube IFrame API once ───────────────────────────────
  useEffect(() => {
    if (ytApiLoadedRef.current) return;
    ytApiLoadedRef.current = true;
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    (window as any).onYouTubeIframeAPIReady = () => { ytReadyRef.current = true; };
  }, []);

  // ── Mark a single video as completed in DB + check course done ─
  const markVideoComplete = useCallback(async (videoIndex: number) => {
    if (!profile?.id || !course?.id) return;
    // Skip if already completed
    if (completedVideos.has(videoIndex)) return;

    await supabase.from("course_video_progress").upsert(
      { user_id: profile.id, course_id: course.id, video_index: videoIndex },
      { onConflict: "user_id,course_id,video_index" }
    );

    const newDone = new Set(completedVideos);
    newDone.add(videoIndex);
    setCompletedVideos(newDone);

    // Update streak
    await updateStreak(profile.id);

    // Check if ALL videos done
    const totalVideos = course.videos?.length ?? 0;
    if (newDone.size >= totalVideos && totalVideos > 0 && !isCourseCompleted) {
      // Mark course as complete
      await supabase.from("course_completions").upsert(
        { user_id: profile.id, course_id: course.id },
        { onConflict: "user_id,course_id" }
      );
      setIsCourseCompleted(true);

      // Issue certificate
      const code = generateCertCode(course.category);
      const { error: certErr } = await supabase.from("certificates").upsert(
        { user_id: profile.id, course_id: course.id, certificate_code: code },
        { onConflict: "user_id,course_id" }
      );
      // Fetch the actual cert (may already exist)
      const { data: existingCert } = await supabase
        .from("certificates")
        .select("certificate_code, issued_at")
        .eq("user_id", profile.id)
        .eq("course_id", course.id)
        .maybeSingle();

      setCertData({
        learnerName: profile.name ?? "Learner",
        courseTitle: course.title,
        artisanName: course.artisan?.name ?? "The Artisan",
        issuedAt: existingCert?.issued_at ?? new Date().toISOString(),
        certificateCode: existingCert?.certificate_code ?? code,
      });
      if (!certErr) setShowCert(true);
    }
  }, [profile, course, completedVideos, isCourseCompleted]);

  // ── Open video (with gate check) ──────────────────────────────
  function openVideo(youtubeIdOrUrl: string, videoIndex: number) {
    if (!youtubeIdOrUrl) return;
    if (!isEnrolled && !isOwner) return;
    if (isNativeVideo(youtubeIdOrUrl)) {
      setActiveVideo({ src: youtubeIdOrUrl, type: "native", videoIndex });
    } else {
      const ytId = extractYouTubeID(youtubeIdOrUrl);
      if (ytId) setActiveVideo({ src: ytId, type: "youtube", videoIndex });
    }
  }

  // ── Bootstrap YouTube player after modal opens ─────────────────
  useEffect(() => {
    if (!activeVideo || activeVideo.type !== "youtube") return;
    const tryCreate = () => {
      if (!(window as any).YT?.Player) { setTimeout(tryCreate, 200); return; }
      ytPlayerRef.current = new (window as any).YT.Player("yt-player-iframe", {
        events: {
          onStateChange: (e: any) => {
            if (e.data === 0) { // ended
              markVideoComplete(activeVideo.videoIndex);
            }
          },
        },
      });
    };
    setTimeout(tryCreate, 500);
    return () => { ytPlayerRef.current = null; };
  }, [activeVideo, markVideoComplete]);

  // ── Enroll ─────────────────────────────────────────────────────
  async function handleEnroll() {
    if (!profile?.id || !course?.id || enrollLoading) return;
    setEnrollLoading(true);
    const { error } = await supabase
      .from("course_enrollments")
      .insert({ course_id: course.id, user_id: profile.id });
    if (!error) {
      setIsEnrolled(true);
      setEnrollCount((c) => c + 1);
      setShowEnrollToast(true);
      setTimeout(() => setShowEnrollToast(false), 3500);
    }
    setEnrollLoading(false);
  }

  // ── Delete course ──────────────────────────────────────────────
  async function confirmDelete() {
    if (!course?.id) return;
    setIsDeleting(true);
    await supabase.from("courses").delete().eq("id", course.id);
    setIsDeleting(false);
    navigate("/dashboard/courses");
  }

  function handleManageCourse() {
    window.dispatchEvent(new CustomEvent(OPEN_EDIT_COURSE_MODAL_EVENT, { detail: { course } }));
  }

  // ── Guards ─────────────────────────────────────────────────────
  if (loading) return <div className={styles.loadingContainer}><Spinner label={t("extended.loadingPortfolio")} /></div>;
  if (!course) return (
    <div className={styles.notFound}>
      <h2>Course not found</h2>
      <button className={styles.backBtn} onClick={() => navigate("/dashboard/courses")}>Back to Courses</button>
    </div>
  );

  const isOwner = activeMode === "artisan" && course.artisan_id === profile?.id;
  const totalVideos = course.videos?.length ?? 0;
  const colonIdx = course.title.indexOf(":");
  const titleMain = colonIdx > -1 ? course.title.slice(0, colonIdx + 1) : course.title;
  const titleSub  = colonIdx > -1 ? course.title.slice(colonIdx + 1).trim() : "";

  return (
    <div className={styles.page}>
      <div className={styles.grainOverlay} />
      <div className={styles.canvas}>
        {/* Back link */}
        <button className={styles.backLink} onClick={() => navigate("/dashboard/courses")}>
          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>arrow_back</span>
          Back to Masterclasses
        </button>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            <div className={styles.heroLeft}>
              <div className={styles.badgeRow}>
                <span className={styles.badgeCategory}>{course.category}</span>
                <span className={styles.badgeLevel}>{course.level}</span>
                {isCourseCompleted && (
                  <span className={styles.badgeCompleted}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.75rem" }}>verified</span>
                    Completed
                  </span>
                )}
              </div>
              <h1 className={styles.heroTitle}>
                {titleMain}
                {titleSub && <><br /><span className={styles.heroTitleItalic}>{titleSub}</span></>}
              </h1>
              <p className={styles.heroDescription}>
                {course.description || "A deep dive into traditional craftsmanship techniques passed down through generations."}
              </p>
            </div>

            <div className={styles.heroRight}>
              <div className={styles.artisanAvatarWrap}>
                {course.artisan?.avatar_url ? (
                  <img src={course.artisan.avatar_url} alt={course.artisan.name} className={styles.artisanAvatar} />
                ) : (
                  <div className={styles.artisanAvatarFallback}>
                    <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--outline)" }}>person</span>
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
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Learners</span>
                  <span className={styles.statValue}>{enrollCount} Enrolled</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className={styles.heroActions}>
            {!isOwner && (
              isEnrolled ? (
                isCourseCompleted ? (
                  <button className={styles.enrolledBtn} onClick={() => setShowCert(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>workspace_premium</span>
                    View Certificate
                  </button>
                ) : (
                  <button className={styles.enrolledBtn} disabled>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>verified</span>
                    Enrolled
                  </button>
                )
              ) : (
                <button className={styles.enrollBtn} onClick={handleEnroll} disabled={enrollLoading}>
                  {enrollLoading ? <Spinner size="sm" inline /> : (
                    <><span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>school</span>Enroll Now</>
                  )}
                </button>
              )
            )}
            {isOwner && (
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button className={styles.viewEnrolledBtn} onClick={() => setShowEnrolledPanel(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>group</span>
                  View Enrolled ({enrollCount})
                </button>
                <button className={styles.editBtn} onClick={handleManageCourse}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>edit</span>
                  Edit Course
                </button>
                <button className={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>delete</span>
                  Delete Course
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Curriculum Section */}
        <section className={styles.curriculumSection}>
          <div className={styles.curriculumHeader}>
            <h2 className={styles.curriculumTitle}>Curriculum</h2>
            <div className={styles.curriculumRule} />
            {isEnrolled && !isOwner && (
              <span className={styles.progressLabel}>
                {completedVideos.size}/{totalVideos} completed
              </span>
            )}
          </div>

          {!isEnrolled && !isOwner && (
            <div className={styles.enrollNotice}>
              <span className="material-symbols-outlined">lock</span>
              <p>Enroll in this course to unlock all videos and start learning.</p>
            </div>
          )}

          <div className={styles.moduleList}>
            {course.videos?.map((video, idx) => {
              const native = isNativeVideo(video.youtube_id);
              const thumbSrc = video.thumbnail || (!native && video.youtube_id
                ? `https://img.youtube.com/vi/${extractYouTubeID(video.youtube_id)}/hqdefault.jpg`
                : "");
              const locked = !isEnrolled && !isOwner;
              const done = completedVideos.has(idx);

              return (
                <div key={idx} className={`${styles.moduleRow} ${locked ? styles.moduleRowLocked : ""} ${done ? styles.moduleRowDone : ""}`}>
                  <div className={styles.moduleThumbWrap}>
                    {thumbSrc ? (
                      <img src={thumbSrc} alt={video.title} className={styles.moduleThumb}
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400"; }} />
                    ) : (
                      <div className={styles.modulePlaceholderImg}><span className="material-symbols-outlined">movie</span></div>
                    )}
                  </div>

                  <div className={styles.moduleRowContent}>
                    <span className={styles.moduleNumber}>Module {String(idx + 1).padStart(2, "0")}</span>
                    <h4 className={styles.moduleTitle}>{video.title}</h4>
                    {video.description && <p className={styles.moduleDesc}>{video.description}</p>}
                    {video.duration_minutes > 0 && (
                      <div className={styles.moduleFooter}>
                        <span className="material-symbols-outlined">schedule</span>
                        <span className={styles.moduleFooterLabel}>{formatDuration(video.duration_minutes)}</span>
                      </div>
                    )}
                  </div>

                  {done ? (
                    <div className={styles.doneIcon} title="Completed">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                  ) : locked ? (
                    <div className={styles.lockIconWrap} title="Enroll to watch">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                  ) : (
                    <button className={styles.modulePlayBtn} title="Play Video"
                      disabled={!video.youtube_id} onClick={() => openVideo(video.youtube_id, idx)}>
                      <span className="material-symbols-outlined">play_circle</span>
                    </button>
                  )}
                </div>
              );
            })}
            {(!course.videos || course.videos.length === 0) && (
              <p className={styles.emptyCurriculum}>Modules are currently being uploaded. Check back soon.</p>
            )}
          </div>
        </section>
      </div>

      {/* Video Overlay */}
      {activeVideo && (
        <div className={styles.videoOverlay} onClick={() => setActiveVideo(null)}>
          <div className={styles.videoModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeVideoBtn} onClick={() => setActiveVideo(null)}>✕</button>
            {activeVideo.type === "youtube" ? (
              <iframe
                id="yt-player-iframe"
                src={`https://www.youtube.com/embed/${activeVideo.src}?autoplay=1&rel=0&enablejsapi=1`}
                title="Course Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
              />
            ) : (
              <video
                src={activeVideo.src}
                controls
                autoPlay
                onEnded={() => markVideoComplete(activeVideo.videoIndex)}
                style={{ width: "100%", height: "100%", borderRadius: "8px", background: "#000" }}
              />
            )}
          </div>
        </div>
      )}

      {/* Enrollment toast */}
      {showEnrollToast && (
        <div className={styles.enrollToast}>
          <span className="material-symbols-outlined">school</span>
          <span>You've been enrolled! Start learning.</span>
        </div>
      )}

      {/* Artisan Enrolled Users Panel */}
      {showEnrolledPanel && (
        <div className={styles.enrolledPanelOverlay} onClick={() => setShowEnrolledPanel(false)}>
          <div className={styles.enrolledPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enrolledPanelHeader}>
              <h3 className={styles.enrolledPanelTitle}>
                <span className="material-symbols-outlined">group</span>
                Enrolled Learners ({enrollCount})
              </h3>
              <button className={styles.enrolledPanelClose} onClick={() => setShowEnrolledPanel(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className={styles.enrolledPanelList}>
              {enrolledUsers.length === 0 ? (
                <p className={styles.enrolledPanelEmpty}>No learners enrolled yet.</p>
              ) : (
                enrolledUsers.map((u) => (
                  <div key={u.id} className={styles.enrolledPanelUser}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.name} className={styles.enrolledPanelAvatar} />
                    ) : (
                      <div className={styles.enrolledPanelAvatarFallback}><span className="material-symbols-outlined">person</span></div>
                    )}
                    <div className={styles.enrolledPanelUserInfo}>
                      <span className={styles.enrolledPanelName}>{u.name}</span>
                      <span className={styles.enrolledPanelDate}>
                        Enrolled {new Date(u.enrolled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "var(--surface)", borderRadius: "16px", padding: "2.5rem", width: "90%", maxWidth: "420px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "3.5rem", color: "#d32f2f", marginBottom: "1rem" }}>warning</span>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--on-surface)", marginBottom: "0.5rem" }}>Delete Course?</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--outline)", marginBottom: "2rem", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{course?.title}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}
                style={{ flex: 1, padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--outline-variant)", backgroundColor: "transparent", color: "var(--on-surface)", fontFamily: "var(--font-label)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={isDeleting}
                style={{ flex: 1, padding: "0.8rem", borderRadius: "8px", border: "none", backgroundColor: "#d32f2f", color: "#fff", fontFamily: "var(--font-label)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", justifyContent: "center", alignItems: "center" }}>
                {isDeleting ? <Spinner size="sm" inline /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showCert}
        onClose={() => setShowCert(false)}
        data={certData}
      />
    </div>
  );
}
