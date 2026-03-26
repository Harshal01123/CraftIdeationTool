import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Spinner from "../../components/Spinner";
import styles from "./EditProfile.module.css";
import type { Profile } from "../../types/chat";

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 400;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
    };
    img.src = url;
  });
}

export default function EditProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [popupMessage, setPopupMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setName(profileData.name || "");
        setLocation(profileData.location || "");
        setBio(profileData.description || "");
        setAvatarPreview(profileData.avatar_url || null);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setSaving(true);
    let errorMsg = "";

    try {
      if (!profile) return;
      const updates: any = { name, location, description: bio };

      if (avatarFile) {
        const compressed = await compressImage(avatarFile);
        const filePath = `${profile.id}/avatar.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, compressed, {
            upsert: true,
            contentType: "image/jpeg",
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          updates.avatar_url = urlData.publicUrl;
        } else {
          throw new Error("Failed to upload image.");
        }
      }

      let passUpdated = false;

      if (newPassword || currentPassword || confirmPassword) {
        if (!currentPassword) {
          throw new Error("Please enter your current password.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("New passwords do not match.");
        }
        if (!newPassword || newPassword.length < 6) {
          throw new Error("New password must be at least 6 characters.");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        if (!session?.user?.email) throw new Error("Invalid session.");

        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: session.user.email,
          password: currentPassword,
        });

        if (verifyErr) {
          throw new Error("Current password is incorrect.");
        }

        const { error: passErr } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passErr) {
          throw new Error(passErr.message);
        }

        setNewPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
        passUpdated = true;
      }

      const { error: profileErr } = await supabase.from("profiles").update(updates).eq("id", profile.id);
      if (profileErr) throw new Error(profileErr.message);

      setPopupMessage(passUpdated ? "Profile and password updated successfully!" : "Profile updated successfully!");
    } catch (err: any) {
      errorMsg = err.message || "An error occurred";
    }

    setSaving(false);
    if (errorMsg) setPopupMessage(errorMsg.trim());
  }

  if (loading) {
    return (
      <div className={styles.loader}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className={styles.mainContent}>
      <form onSubmit={handleSave} className={styles.formContainer}>
        {/* Section 1: Profile Header Card */}
        <section className={styles.sectionCardHeader}>
          <div className={styles.headerLayout}>
            <div className={styles.avatarGroup}>
              <div className={styles.avatarWrapper}>
                {avatarPreview || profile?.avatar_url ? (
                  <img
                    src={avatarPreview || profile?.avatar_url!}
                    alt="Profile"
                    className={styles.avatarImg}
                  />
                ) : (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "4rem", color: "var(--outline)" }}
                  >
                    person
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.cameraBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>

            <div className={styles.headerInfo}>
              <div className={styles.nameRow}>
                <h3 className={styles.profileName}>{name || "Guest"}</h3>
                <span className={styles.roleBadge}>
                  {profile?.role === "artisan" ? "Artisan" : "Customer"}
                </span>
              </div>
              <p className={styles.memberSince}>
                Member since{" "}
                {new Date(profile?.created_at || Date.now()).toLocaleDateString(
                  "en-US",
                  { month: "long", year: "numeric" },
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Personal Information */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitleRow}>
            <span className={`material-symbols-outlined ${styles.sectionIcon}`}>
              person
            </span>
            <h4 className={styles.sectionTitle}>Personal Information</h4>
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
              <label>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
              <label>Bio / Description</label>
              <textarea
                rows={4}
                value={bio}
                maxLength={500}
                onChange={(e) => {
                  setBio(e.target.value);
                  e.target.style.height = "inherit";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                style={{ overflow: "hidden", resize: "none" }}
              ></textarea>
              <div
                style={{
                  textAlign: "right",
                  fontSize: "0.75rem",
                  color: "var(--outline)",
                  marginTop: "0.25rem",
                }}
              >
                {bio.length}/500
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Security & Password */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitleRow}>
            <span className={`material-symbols-outlined ${styles.sectionIcon}`}>
              lock
            </span>
            <h4 className={styles.sectionTitle}>Security &amp; Password</h4>
          </div>

          <div className={styles.securityLayout}>
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label>Current Password</label>
                <span className={styles.hindiLabel}>पुरानी गोपनीयता</span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ paddingRight: "2.5rem", width: "100%" }}
                />
                <span
                  className="material-symbols-outlined"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "var(--outline)",
                  }}
                >
                  {showCurrentPassword ? "visibility_off" : "visibility"}
                </span>
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingRight: "2.5rem", width: "100%" }}
                  />
                  <span
                    className="material-symbols-outlined"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute",
                      right: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "var(--outline)",
                    }}
                  >
                    {showNewPassword ? "visibility_off" : "visibility"}
                  </span>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: "2.5rem", width: "100%" }}
                  />
                  <span
                    className="material-symbols-outlined"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "var(--outline)",
                    }}
                  >
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? <Spinner size="sm" inline /> : "Save Changes"}
            {!saving && (
              <span className="material-symbols-outlined">check_circle</span>
            )}
          </button>
        </div>
      </form>

      {popupMessage && (
        <div
          className={styles.popupOverlay}
          onClick={() => setPopupMessage(null)}
        >
          <div
            className={styles.popupCard}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Notice</h3>
            <p>{popupMessage}</p>
            <button
              className={styles.closeBtn}
              onClick={() => setPopupMessage(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
