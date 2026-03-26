import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Spinner from "../../components/Spinner";
import styles from "./EditProfile.module.css";
import type { Profile } from "../../types/chat";

export default function EditProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
        
      if (profileData) {
        setProfile(profileData);
        setName(profileData.name || "");
        setUsername(profileData.name?.toLowerCase().replace(/\s/g, "_") || "");
        setLocation("Jaipur, Rajasthan, India");
        setBio("Dedicated to preserving the intricate weaving traditions. Over 15 years experience in textile conservation and digital storytelling for regional artisans.");
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    if (profile) {
      await supabase.from("profiles").update({ name }).eq("id", profile.id);
    }
    
    // Simulate delay for password and other fields since they are frontend only for now
    setTimeout(() => setSaving(false), 800);
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
      <header className={styles.pageHeader}>
        <p className={styles.subtitle}>Crafting your digital presence within the heritage gallery.</p>
      </header>

      <form onSubmit={handleSave} className={styles.formContainer}>
        {/* Section 1: Profile Header Card */}
        <section className={styles.sectionCardHeader}>
          <div className={styles.headerLayout}>
            <div className={styles.avatarGroup}>
              <div className={styles.avatarWrapper}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className={styles.avatarImg} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: "4rem", color: "var(--outline)" }}>person</span>
                )}
              </div>
              <button type="button" className={styles.cameraBtn}>
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
            </div>
            
            <div className={styles.headerInfo}>
              <div className={styles.nameRow}>
                <h3 className={styles.profileName}>{name || "Guest"}</h3>
                <span className={styles.roleBadge}>{profile?.role === "artisan" ? "Master Curator" : "Customer"}</span>
              </div>
              <p className={styles.memberSince}>Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}</p>
              <p className={styles.hindiName}>अर्जुन शर्मा</p>
            </div>
          </div>
        </section>

        {/* Section 2: Personal Information */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitleRow}>
            <span className={`material-symbols-outlined ${styles.sectionIcon}`}>person</span>
            <h4 className={styles.sectionTitle}>Personal Information</h4>
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label>Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
              <label>Bio / Description</label>
              <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)}></textarea>
            </div>
          </div>
        </section>

        {/* Section 3: Security & Password */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitleRow}>
            <span className={`material-symbols-outlined ${styles.sectionIcon}`}>lock</span>
            <h4 className={styles.sectionTitle}>Security &amp; Password</h4>
          </div>

          <div className={styles.securityLayout}>
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label>Current Password</label>
                <span className={styles.hindiLabel}>पुरानी गोपनीयता</span>
              </div>
              <input type="password" placeholder="••••••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>New Password</label>
                <input type="password" placeholder="••••••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <label>Confirm New Password</label>
                <input type="password" placeholder="••••••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => window.history.back()}>Cancel</button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? <Spinner size="sm" inline /> : "Save Changes"}
            {!saving && <span className="material-symbols-outlined">check_circle</span>}
          </button>
        </div>
      </form>

      <div className={styles.decorativeFooter}>
        <div className={styles.quoteBox}>
          <div className={styles.dotTopLeft}></div>
          <div className={styles.dotTopRight}></div>
          <div className={styles.dotBottomLeft}></div>
          <div className={styles.dotBottomRight}></div>
          <p>"Tradition is not the worship of ashes, but the preservation of fire."</p>
        </div>
      </div>
    </main>
  );
}
