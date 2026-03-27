import React, { useState } from "react";
import YouTube from "react-youtube";
import { supabase } from "../../lib/supabase";
import styles from "../products/AddProductModal.module.css";

interface CreateCourseModalProps {
  artisanId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface VideoInput {
  title: string;
  youtubeId: string;
  durationMinutes: number;
}

export default function CreateCourseModal({
  artisanId,
  onClose,
  onSaved,
}: CreateCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [category, setCategory] = useState("Pottery");
  const [level, setLevel] = useState("Beginner");
  
  const [numVideos, setNumVideos] = useState(1);
  const [videos, setVideos] = useState<VideoInput[]>([{ title: "", youtubeId: "", durationMinutes: 0 }]);

  // Handle change in number of videos
  const handleNumVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let count = parseInt(e.target.value) || 1;
    if (count < 1) count = 1;
    if (count > 20) count = 20; // safety limit
    setNumVideos(count);
    
    setVideos(prev => {
      const newVideos = [...prev];
      if (newVideos.length < count) {
        while (newVideos.length < count) {
          newVideos.push({ title: "", youtubeId: "", durationMinutes: 0 });
        }
      } else {
        newVideos.length = count;
      }
      return newVideos;
    });
  };

  const handleVideoChange = (index: number, field: keyof VideoInput, value: string | number) => {
    setVideos(prev => {
      const newVideos = [...prev];
      newVideos[index] = { ...newVideos[index], [field]: value };
      return newVideos;
    });
  };

  const handleVideoReady = (index: number, durationSeconds: number) => {
    if (durationSeconds > 0) {
      const mins = Math.ceil(durationSeconds / 60);
      setVideos((prev) => {
        const newVideos = [...prev];
        if (!newVideos[index].durationMinutes || newVideos[index].durationMinutes === 0) {
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
    if (!title) {
        setError("Course name is required.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const totalDuration = videos.reduce((sum, v) => sum + (Number(v.durationMinutes) || 0), 0);
      
      const processedVideos = videos.map(v => ({
          title: v.title,
          duration_minutes: Number(v.durationMinutes) || 0,
          youtube_id: extractYouTubeID(v.youtubeId)
      }));

      const { error: insertError } = await supabase.from("courses").insert({
        artisan_id: artisanId,
        title,
        category,
        level,
        duration_minutes: totalDuration,
        thumbnail: thumbnail || "https://images.unsplash.com/photo-1549445100-d66ffb7e4f1a?auto=format&fit=crop&q=80&w=800",
        videos: processedVideos,
      });

      if (insertError) throw insertError;

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
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Create New Course</h2>
          <button 
            type="button"
            className={styles.submitBtn} 
            onClick={onClose}
            style={{ width: "40px", height: "40px", padding: "0", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Course Name *</label>
            <input
              type="text"
              required
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Terracotta"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Course Thumbnail URL *</label>
            <input
              type="url"
              required
              className={styles.input}
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="e.g. https://images.unsplash.com/photo-1549..."
            />
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>Industry / Category</label>
              <select
                className={styles.input}
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
            </div>

            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>Difficulty Level</label>
              <select
                className={styles.input}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Number of Videos</label>
            <input
              type="number"
              min="1"
              max="20"
              required
              className={styles.input}
              value={numVideos}
              onChange={handleNumVideosChange}
            />
          </div>

          <div style={{ marginTop: "1rem", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1rem", fontFamily: "var(--font-display)" }}>
                Video Lectures
            </h3>
            {videos.map((vid, idx) => (
              <div key={idx} style={{ background: "#f9f9f9", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                <p style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Video {idx + 1}</p>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label} style={{ fontSize: "0.75rem" }}>Video Title</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={vid.title}
                    onChange={(e) => handleVideoChange(idx, "title", e.target.value)}
                    placeholder="e.g. Basics of Weaving"
                  />
                </div>
                
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                    <div className={styles.inputGroup} style={{ flex: 2 }}>
                    <label className={styles.label} style={{ fontSize: "0.75rem" }}>YouTube Link (or ID)</label>
                    <input
                        type="text"
                        required
                        className={styles.input}
                        value={vid.youtubeId}
                        onChange={(e) => handleVideoChange(idx, "youtubeId", e.target.value)}
                        placeholder="https://youtu.be/..."
                    />
                    </div>
                    
                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                    <label className={styles.label} style={{ fontSize: "0.75rem" }}>Duration (mins)</label>
                    <input
                        type="number"
                        min="1"
                        required
                        className={styles.input}
                        value={vid.durationMinutes || ""}
                        onChange={(e) => handleVideoChange(idx, "durationMinutes", parseInt(e.target.value) || 0)}
                        placeholder="45"
                    />
                    </div>
                </div>
                {/* INVISIBLE YOUTUBE PLAYER FOR AUTO LENGTH CALCULATION */}
                {vid.youtubeId && extractYouTubeID(vid.youtubeId) && (
                  <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: "1px", height: "1px", overflow: "hidden" }}>
                    <YouTube 
                       videoId={extractYouTubeID(vid.youtubeId)} 
                       onReady={(e) => handleVideoReady(idx, e.target.getDuration())} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.actions}>
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
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Saving..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
