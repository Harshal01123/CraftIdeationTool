import React, { useState } from "react";
import YouTube from "react-youtube";
import { supabase } from "../../lib/supabase";
import styles from "./CreateCourseModal.module.css";

interface CreateCourseModalProps {
  artisanId: string;
  existingCourse?: any;
  onClose: () => void;
  onSaved: () => void;
}

interface VideoInput {
  title: string;
  description: string;
  sourceType: "youtube" | "native";
  youtubeId: string;
  nativeFile?: File;
  nativeFileName?: string;
  durationMinutes: number;
  thumbnailFile?: File;
  thumbnailPreview?: string;
}

const dataURLtoFile = (dataurl: string, filename: string) => {
  const arr = dataurl.split(",");
  const match = arr[0].match(/:(.*?);/);
  const mime = match ? match[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function CreateCourseModal({
  artisanId,
  existingCourse,
  onClose,
  onSaved,
}: CreateCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [isAutoThumbnail, setIsAutoThumbnail] = useState<boolean>(true);
  const [category, setCategory] = useState("Pottery");
  const [level, setLevel] = useState("Beginner");

  const [numVideos, setNumVideos] = useState(1);
  const [videos, setVideos] = useState<VideoInput[]>([
    { title: "", description: "", sourceType: "youtube", youtubeId: "", durationMinutes: 0 },
  ]);

  React.useEffect(() => {
    if (existingCourse) {
      setTitle(existingCourse.title || "");
      setDescription(existingCourse.description || "");
      if (existingCourse.thumbnail) {
        setThumbnail(existingCourse.thumbnail);
        setThumbnailPreview(existingCourse.thumbnail);
        setIsAutoThumbnail(false);
      }
      setCategory(existingCourse.category || "Pottery");
      setLevel(existingCourse.level || "Beginner");

      if (existingCourse.videos && existingCourse.videos.length > 0) {
        setNumVideos(existingCourse.videos.length);
        const mappedVideos: VideoInput[] = existingCourse.videos.map((v: any) => {
          const isYoutube = !v.youtube_id?.includes("supabase.co");
          return {
            title: v.title || "",
            description: v.description || "",
            sourceType: isYoutube ? "youtube" : "native",
            youtubeId: isYoutube ? v.youtube_id : "",
            nativeFileName: isYoutube ? "" : "Existing Video File",
            durationMinutes: v.duration_minutes || 0,
            thumbnailPreview: v.thumbnail || "",
          };
        });
        setVideos(mappedVideos);
      }
    }
  }, [existingCourse]);

  const recalculateAutoThumbnail = (v: VideoInput) => {
     if (v.sourceType === "youtube" && v.youtubeId) {
        const ytId = extractYouTubeID(v.youtubeId);
        if (ytId && ytId.length === 11) {
            setThumbnail(`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`);
            setThumbnailPreview("");
            setThumbnailFile(null);
        } else {
            setThumbnail("");
            setThumbnailPreview("");
            setThumbnailFile(null);
        }
     } else if (v.sourceType === "native" && v.nativeFile) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.setAttribute("playsinline", "");
        video.src = URL.createObjectURL(v.nativeFile);
        video.onloadedmetadata = () => { video.currentTime = Math.min(1, video.duration / 2); };
        video.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            setThumbnailFile(dataURLtoFile(dataUrl, "auto_thumbnail.jpg"));
            setThumbnailPreview(dataUrl);
            setThumbnail("");
            window.URL.revokeObjectURL(video.src);
        };
     } else {
        setThumbnail("");
        setThumbnailPreview("");
        setThumbnailFile(null);
     }
  };

  const updateVideoCount = (count: number) => {
    if (count < 1) count = 1;
    if (count > 20) count = 20; // safety limit
    setNumVideos(count);

    setVideos((prev) => {
      const newVideos = [...prev];
      if (newVideos.length < count) {
        while (newVideos.length < count) {
          newVideos.push({ title: "", description: "", sourceType: "youtube", youtubeId: "", durationMinutes: 0 });
        }
      } else {
        newVideos.length = count;
      }
      return newVideos;
    });
  };

  const handleVideoChange = (
    index: number,
    field: keyof VideoInput,
    value: any,
  ) => {
    setVideos((prev) => {
      const newVideos = [...prev];
      newVideos[index] = { ...newVideos[index], [field]: value };
      return newVideos;
    });
  };

  const handleNativeVideoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleVideoChange(index, "nativeFile", file);
      handleVideoChange(index, "nativeFileName", file.name);
      handleVideoChange(index, "youtubeId", "");

      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.setAttribute("playsinline", ""); // Required for some browsers to load natively
      video.src = URL.createObjectURL(file);

      video.onloadedmetadata = function () {
        const durationSeconds = video.duration;
        if (durationSeconds > 0) {
          const mins = Math.ceil(durationSeconds / 60);
          handleVideoChange(index, "durationMinutes", mins);
        }

        if (index === 0 && isAutoThumbnail) {
           video.currentTime = Math.min(1, video.duration / 2);
        } else {
           window.URL.revokeObjectURL(video.src);
        }
      };

      video.onseeked = function () {
        if (!isAutoThumbnail) {
           window.URL.revokeObjectURL(video.src);
           return;
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        const autoThumbFile = dataURLtoFile(dataUrl, "auto_thumbnail.jpg");
        setThumbnailFile(autoThumbFile);
        setThumbnailPreview(dataUrl);
        setThumbnail("");

        window.URL.revokeObjectURL(video.src);
      };
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setThumbnail(""); // clear string url
      setIsAutoThumbnail(false);
    }
  };

  const handleVideoReady = (index: number, durationSeconds: number) => {
    if (durationSeconds > 0) {
      const mins = Math.ceil(durationSeconds / 60);
      setVideos((prev) => {
        const newVideos = [...prev];
        if (
          !newVideos[index].durationMinutes ||
          newVideos[index].durationMinutes === 0
        ) {
          newVideos[index] = { ...newVideos[index], durationMinutes: mins };
        }
        return newVideos;
      });
    }
  };

  // Extract YouTube ID from common formats
  const extractYouTubeID = (url: string) => {
    if (!url.includes("http") && !url.includes("youtu")) return url;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v") || "";
      } else if (urlObj.hostname.includes("youtu.be")) {
        return urlObj.pathname.slice(1);
      }
    } catch {
      return url;
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Course name is required.");
      return;
    }
    if (!description.trim()) {
      setError("Course description is required.");
      return;
    }
    if (!artisanId) {
      setError("Could not identify your account. Please refresh the page and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalThumbnailUrl = thumbnail;

      // Upload course thumbnail if user selected a file
      if (thumbnailFile) {
        // Helper: read file as data URL (fallback if storage upload fails)
        const readAsDataUrl = (file: File): Promise<string> =>
          new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(file);
          });

        try {
          const ext = thumbnailFile.name.split(".").pop();
          const filePath = `courses/${artisanId}/thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("products")
            .upload(filePath, thumbnailFile, { upsert: true });

          if (uploadError) {
            console.warn("[CreateCourse] Storage upload failed, using data URL:", uploadError.message);
            finalThumbnailUrl = await readAsDataUrl(thumbnailFile);
          } else {
            const { data: urlData } = supabase.storage.from("products").getPublicUrl(filePath);
            finalThumbnailUrl = urlData.publicUrl;
          }
        } catch (e) {
          console.warn("[CreateCourse] Thumbnail upload exception, using data URL:", e);
          try { finalThumbnailUrl = await readAsDataUrl(thumbnailFile); } catch (_) {}
        }
      }

      // Upload videos if available
      const processedVideos = await Promise.all(
        videos.map(async (v, idx) => {
          let finalVidUrl = extractYouTubeID(v.youtubeId);

          if (v.sourceType === "native" && v.nativeFile) {
            try {
              const ext = v.nativeFile.name.split(".").pop();
              const filePath = `courses/${artisanId}/vid_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
              const { error: uploadError } = await supabase.storage
                .from("products")
                .upload(filePath, v.nativeFile, { upsert: true });

              if (uploadError) {
                console.warn(`[CreateCourse] Video ${idx + 1} upload failed:`, uploadError.message);
              } else {
                const { data: urlData } = supabase.storage.from("products").getPublicUrl(filePath);
                finalVidUrl = urlData.publicUrl;
              }
            } catch (e) {
              console.warn(`[CreateCourse] Video ${idx + 1} upload exception:`, e);
            }
          }

          // Per-video thumbnail upload (non-fatal — falls back to YouTube auto-thumb)
          let finalVidThumb = "";
          if (v.thumbnailFile) {
            const readFileAsDataUrl = (file: File): Promise<string> =>
              new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
            try {
              const ext = v.thumbnailFile.name.split(".").pop();
              const thumbPath = `courses/${artisanId}/vidthumb_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
              const { error: thumbErr } = await supabase.storage
                .from("products")
                .upload(thumbPath, v.thumbnailFile, { upsert: true });
              if (thumbErr) {
                console.warn(`[CreateCourse] Video ${idx + 1} thumb storage failed, using data URL:`, thumbErr.message);
                finalVidThumb = await readFileAsDataUrl(v.thumbnailFile);
              } else {
                const { data: thumbUrl } = supabase.storage.from("products").getPublicUrl(thumbPath);
                finalVidThumb = thumbUrl.publicUrl;
              }
            } catch (e) {
              console.warn(`[CreateCourse] Video ${idx + 1} thumb exception:`, e);
              try { if (v.thumbnailFile) finalVidThumb = await (() => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload=()=>res(r.result as string); r.onerror=rej; r.readAsDataURL(v.thumbnailFile!); }))(); } catch(_) {}
            }
          }
          // Auto-thumbnail from YouTube if no custom one
          if (!finalVidThumb && v.sourceType === "youtube" && finalVidUrl) {
            finalVidThumb = `https://img.youtube.com/vi/${finalVidUrl}/hqdefault.jpg`;
          }

          return {
            title: v.title || `Video ${idx + 1}`,
            description: v.description || "",
            thumbnail: finalVidThumb,
            duration_minutes: Number(v.durationMinutes) || 0,
            youtube_id: finalVidUrl,
          };
        })
      );

      const totalDuration = processedVideos.reduce(
        (sum, v) => sum + (v.duration_minutes || 0),
        0,
      );

      // Derive best available thumbnail URL
      const firstYtId = processedVideos[0]?.youtube_id;
      const autoYtThumb = firstYtId ? `https://img.youtube.com/vi/${firstYtId}/hqdefault.jpg` : null;

      const payload = {
        artisan_id: artisanId,
        title: title.trim(),
        description: description.trim(),
        category,
        level,
        duration_minutes: Math.round(totalDuration),
        thumbnail:
          finalThumbnailUrl ||
          autoYtThumb ||
          "https://images.unsplash.com/photo-1549445100-d66ffb7e4f1a?auto=format&fit=crop&q=80&w=800",
        videos: processedVideos,
      };

      if (existingCourse?.id) {
        console.log("[CreateCourse] Updating payload:", JSON.stringify(payload, null, 2));
        const { error: updateError } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", existingCourse.id);

        if (updateError) {
          console.error("[CreateCourse] DB update error:", updateError);
          throw updateError;
        }
      } else {
        console.log("[CreateCourse] Inserting payload:", JSON.stringify(payload, null, 2));
        const { error: insertError } = await supabase.from("courses").insert(payload);

        if (insertError) {
          console.error("[CreateCourse] DB insert error:", insertError);
          throw insertError;
        }
      }

      onSaved();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while saving the course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.paperGrain}></div>

        <div className={styles.modalContentWrap}>
          {/* Header Section */}
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{existingCourse ? "Edit Course" : "Add New Course"}</h2>
              <p className={styles.hindiSubtitle}>{existingCourse ? "पाठ्यक्रम संपादित करें" : "नया पाठ्यक्रम"}</p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {error && <div className={styles.formError}>{error}</div>}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Two-Column Form Layout */}
            <div className={styles.formLayout}>
              {/* Left Column: Course Details */}
              <div className={styles.leftColumn}>
                <h3 className={styles.sectionLabel}>Course Details</h3>

                <div className={styles.fieldsContainer}>
                  {/* Course Name */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Course Name</label>
                    <input
                      type="text"
                      required
                      className={styles.inputElement}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Traditional Madhubani Fundamentals"
                    />
                  </div>

                  {/* Course Description */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Course Description</label>
                    <textarea
                      required
                      className={styles.inputElement}
                      style={{ minHeight: "80px", resize: "vertical" }}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief overview of what students will learn..."
                    />
                  </div>

                  {/* Course Thumbnail Upload */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Course Thumbnail
                    </label>
                    <div style={{ position: "relative", overflow: "hidden", display: "inline-block", marginBottom: "0.5rem" }}>
                        <div
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "white",
                            padding: "0.6rem 1.2rem",
                            borderRadius: "0.5rem",
                            fontFamily: "var(--font-label)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {(thumbnailPreview || thumbnail) && !isAutoThumbnail ? "Replace Custom Thumbnail" : "Upload Custom Thumbnail"}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                        />
                    </div>
                    
                    <div
                      className={styles.thumbnailPreviewBox}
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "180px",
                        backgroundImage: thumbnailPreview || thumbnail ? `url(${thumbnailPreview || thumbnail})` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "0.5rem",
                        border: "1px dashed var(--outline-variant)",
                      }}
                    >
                      {!(thumbnailPreview || thumbnail) && (
                        <span className="material-symbols-outlined" style={{ color: "color-mix(in srgb, var(--outline) 40%, transparent)", fontSize: "2rem" }}>
                          image
                        </span>
                      )}

                      {(thumbnailPreview || thumbnail) && (
                        <div style={{ position: "absolute", bottom: "0.5rem", right: "0.5rem", display: "flex", gap: "0.5rem" }}>
                           {isAutoThumbnail && (
                             <span style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>Auto-Generated</span>
                           )}
                           {!isAutoThumbnail && (
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.preventDefault();
                                 setThumbnail("");
                                 setThumbnailPreview("");
                                 setThumbnailFile(null);
                                 setIsAutoThumbnail(true);
                                 if (videos[0]) {
                                    recalculateAutoThumbnail(videos[0]);
                                 }
                               }}
                               style={{ backgroundColor: "var(--error)", color: "white", border: "none", padding: "0.25rem", borderRadius: "0.25rem", cursor: "pointer", display: "flex", alignItems: "center" }}
                               title="Remove custom thumbnail"
                             >
                               <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>delete</span>
                             </button>
                           )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Industry/Category & Difficulty Row */}
                  <div className={styles.grid2Col}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Industry / Category
                      </label>
                      <div style={{ position: "relative" }}>
                        <select
                          className={styles.inputElement}
                          style={{
                            appearance: "none",
                            paddingRight: "1.5rem",
                            width: "100%",
                          }}
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="Pottery">Pottery</option>
                          <option value="Bamboo">Bamboo</option>
                          <option value="Glass">Glass</option>
                          <option value="Tiles">Tiles</option>
                          <option value="Handloom">Handloom</option>
                          <option value="Painting">Painting</option>
                        </select>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "var(--outline)",
                          }}
                        >
                          arrow_drop_down
                        </span>
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Difficulty Level
                      </label>
                      <div style={{ position: "relative" }}>
                        <select
                          className={styles.inputElement}
                          style={{
                            appearance: "none",
                            paddingRight: "1.5rem",
                            width: "100%",
                          }}
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Master</option>
                        </select>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "var(--outline)",
                          }}
                        >
                          arrow_drop_down
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Number of Videos Counter */}
                  <div className={styles.counterSection}>
                    <label
                      className={styles.inputLabel}
                      style={{ marginBottom: "0.75rem" }}
                    >
                      Number of Videos
                    </label>
                    <div className={styles.counterRow}>
                      <div className={styles.counterBox}>
                        <button
                          type="button"
                          className={styles.counterBtn}
                          onClick={() => updateVideoCount(numVideos - 1)}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "0.875rem" }}
                          >
                            remove
                          </span>
                        </button>
                        <span className={styles.counterValue}>
                          {numVideos.toString().padStart(2, "0")}
                        </span>
                        <button
                          type="button"
                          className={styles.counterBtn}
                          onClick={() => updateVideoCount(numVideos + 1)}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "0.875rem" }}
                          >
                            add
                          </span>
                        </button>
                      </div>
                      <span className={styles.counterContext}>
                        Videos scheduled for curriculum
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Video Content */}
              <div className={styles.rightColumn}>
                <div className={styles.videoSectionHeader}>
                  <h3 className={styles.sectionLabel}>Video Content</h3>
                </div>

                {videos.map((vid, idx) => (
                  <div key={idx} className={styles.videoCard}>
                    {idx > 0 && (
                      <button
                        type="button"
                        className={styles.removeVideoBtn}
                        onClick={() => updateVideoCount(numVideos - 1)}
                        title="Remove Video"
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "1rem" }}
                        >
                          delete
                        </span>
                      </button>
                    )}

                    <div className={styles.videoInputGroup} style={{ marginBottom: "1rem" }}>
                      <label className={styles.videoInputLabel}>Video Title</label>
                      <input
                        type="text"
                        required
                        className={styles.videoInput}
                        value={vid.title}
                        onChange={(e) => handleVideoChange(idx, "title", e.target.value)}
                        placeholder={`e.g. Module ${idx + 1}: Introduction`}
                      />
                    </div>

                    <div className={styles.videoInputGroup} style={{ marginBottom: "1rem" }}>
                      <label className={styles.videoInputLabel}>Video Description</label>
                      <textarea
                        required
                        className={styles.videoInput}
                        style={{ minHeight: "56px", resize: "vertical" }}
                        value={vid.description}
                        onChange={(e) => handleVideoChange(idx, "description", e.target.value)}
                        placeholder="Brief summary of what's covered in this video..."
                      />
                    </div>

                    <div className={styles.videoInputGroup} style={{ marginBottom: "1rem" }}>
                      <label className={styles.videoInputLabel}>Custom Thumbnail (optional — auto-set from YouTube)</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                        <label style={{
                          backgroundColor: "var(--surface-container-high)",
                          color: "var(--primary)",
                          padding: "0.4rem 0.9rem",
                          borderRadius: "0.5rem",
                          fontFamily: "var(--font-label)",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          flexShrink: 0,
                        }}>
                          Choose File
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                handleVideoChange(idx, "thumbnailFile", file);
                                handleVideoChange(idx, "thumbnailPreview", URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                        {vid.thumbnailPreview ? (
                          <div style={{ position: "relative", display: "inline-flex" }}>
                            <img src={vid.thumbnailPreview} alt="thumb" style={{ height: "44px", borderRadius: "4px", objectFit: "cover" }} />
                            <button
                              type="button"
                              onClick={() => {
                                handleVideoChange(idx, "thumbnailFile", undefined);
                                handleVideoChange(idx, "thumbnailPreview", undefined);
                              }}
                              style={{ position: "absolute", top: -5, right: -5, background: "var(--primary)", color: "#fff", border: "none", borderRadius: "50%", width: "16px", height: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>close</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.7rem", color: "var(--outline)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>
                            {vid.sourceType === "youtube" && vid.youtubeId ? "YouTube thumbnail will be used automatically" : "No file selected"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.videoInputGroup} style={{ marginBottom: "1rem" }}>
                      <label className={styles.videoInputLabel}>Video Source Type</label>
                      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem" }}>
                        <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", color: vid.sourceType === "youtube" ? "var(--primary)" : "var(--outline)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>
                          <input type="radio" checked={vid.sourceType === "youtube"} onChange={() => {
                            handleVideoChange(idx, "sourceType", "youtube");
                            if (idx === 0 && isAutoThumbnail) {
                                recalculateAutoThumbnail({ ...vid, sourceType: "youtube" });
                            }
                          }} style={{ display: "none" }} />
                          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>{vid.sourceType === "youtube" ? "radio_button_checked" : "radio_button_unchecked"}</span>
                          YouTube Link
                        </label>
                        <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", color: vid.sourceType === "native" ? "var(--primary)" : "var(--outline)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>
                          <input type="radio" checked={vid.sourceType === "native"} onChange={() => {
                            handleVideoChange(idx, "sourceType", "native");
                            if (idx === 0 && isAutoThumbnail) {
                                recalculateAutoThumbnail({ ...vid, sourceType: "native" });
                            }
                          }} style={{ display: "none" }} />
                          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>{vid.sourceType === "native" ? "radio_button_checked" : "radio_button_unchecked"}</span>
                          Upload Native MP4
                        </label>
                      </div>
                    </div>

                    <div className={styles.videoGridRow}>
                      <div className={`${styles.videoInputGroup} ${styles.videoLinkCol}`}>
                        <label className={styles.videoInputLabel}>
                          {vid.sourceType === "youtube" ? "YouTube Link / ID" : "Local Video File"}
                        </label>

                        {vid.sourceType === "youtube" ? (
                          <div className={styles.videoInlineInput}>
                            <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: "var(--outline)", marginRight: "0.5rem" }}>link</span>
                            <input
                              type="text"
                              required={vid.sourceType === "youtube"}
                              className={styles.videoInput}
                              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--on-surface)", fontSize: "0.875rem" }}
                              value={vid.youtubeId}
                              onChange={(e) => {
                                const newYtId = e.target.value;
                                handleVideoChange(idx, "youtubeId", newYtId);
                                handleVideoChange(idx, "durationMinutes", 0);
                                
                                if (idx === 0 && isAutoThumbnail) {
                                  recalculateAutoThumbnail({ ...vid, youtubeId: newYtId });
                                }
                              }}
                              placeholder="y2u.be/dQw4w9WgXcQ"
                            />
                          </div>
                        ) : (
                          <div
                            className={styles.videoInlineInput}
                            style={{ position: "relative", cursor: "pointer", border: "1px dashed var(--outline-variant)", backgroundColor: "var(--surface-container-low)" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: "var(--primary)", marginRight: "0.5rem" }}>upload_file</span>
                            <span style={{ fontSize: "0.875rem", color: vid.nativeFileName ? "var(--on-surface)" : "var(--outline)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {vid.nativeFileName || "Browse local video file..."}
                            </span>
                            {vid.nativeFile && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleVideoChange(idx, "nativeFile", undefined);
                                  handleVideoChange(idx, "nativeFileName", "");
                                  handleVideoChange(idx, "durationMinutes", 0);
                                  
                                  if (idx === 0 && isAutoThumbnail) {
                                    recalculateAutoThumbnail({ ...vid, nativeFile: undefined, nativeFileName: "" });
                                  }
                                }}
                                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "0.25rem", zIndex: 10 }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: "var(--error)" }}>close</span>
                              </button>
                            )}
                            {!vid.nativeFile && (
                              <input
                                type="file"
                                accept="video/*"
                                required={vid.sourceType === "native" && !vid.nativeFile}
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                                onChange={(e) => handleNativeVideoUpload(idx, e)}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <div className={`${styles.videoInputGroup} ${styles.videoDurCol}`}>
                        <label className={styles.videoInputLabel}>
                          Duration
                        </label>
                        <div className={styles.videoInlineInput}>
                          <input
                            type="number"
                            min="1"
                            required
                            readOnly={vid.sourceType === "youtube" || !!vid.nativeFile}
                            className={`${styles.videoInput} ${styles.videoInputRowSm}`}
                            style={{ 
                                flex: 1,
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                color: "var(--on-surface)",
                                fontSize: "0.875rem",
                                textAlign: "right",
                                cursor: (vid.sourceType === "youtube" || !!vid.nativeFile) ? "not-allowed" : "text",
                                opacity: (vid.sourceType === "youtube" || !!vid.nativeFile) ? 0.8 : 1
                            }}
                            value={vid.durationMinutes || ""}
                            onChange={(e) =>
                              handleVideoChange(
                                idx,
                                "durationMinutes",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            placeholder="auto"
                          />
                          <span className={styles.durUnitLabel} style={{ marginLeft: "0.5rem" }}>MINS</span>
                        </div>
                      </div>
                    </div>

                    {/* INVISIBLE YOUTUBE PLAYER FOR AUTO LENGTH CALCULATION */}
                    {vid.sourceType === "youtube" &&
                      vid.youtubeId &&
                      extractYouTubeID(vid.youtubeId) && (
                        <div
                          style={{
                            position: "absolute",
                            opacity: 0,
                            pointerEvents: "none",
                            width: "1px",
                            height: "1px",
                            overflow: "hidden",
                          }}
                        >
                          <YouTube
                            key={extractYouTubeID(vid.youtubeId) || `yt-${idx}`}
                            videoId={extractYouTubeID(vid.youtubeId)}
                            onReady={(e) =>
                              handleVideoReady(idx, e.target.getDuration())
                            }
                          />
                        </div>
                      )}
                  </div>
                ))}

                {videos.length < 20 && (
                  <div
                    className={styles.videoCard}
                    style={{
                      cursor: "pointer",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "8rem",
                      border:
                        "2px dashed color-mix(in srgb, var(--outline-variant) 40%, transparent)",
                      backgroundColor:
                        "color-mix(in srgb, var(--surface-container-high) 50%, transparent)",
                      boxShadow: "none",
                    }}
                    onClick={() => updateVideoCount(numVideos + 1)}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "2rem",
                        color:
                          "color-mix(in srgb, var(--outline) 40%, transparent)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      add_task
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-label)",
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color:
                          "color-mix(in srgb, var(--outline) 40%, transparent)",
                      }}
                    >
                      Draft next video details
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / CTAs */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtnPrimary}
                disabled={loading}
              >
                {loading ? "Saving & Uploading..." : (existingCourse ? "Update Course" : "Create Course")}
                {!loading && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "0.875rem" }}
                  >
                    {existingCourse ? "check" : "arrow_forward"}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
