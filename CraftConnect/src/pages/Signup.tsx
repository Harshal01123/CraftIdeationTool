import styles from "./Signup.module.css";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import { INDUSTRY_OPTIONS } from "../constants/industryOptions";
import { supabase } from "../lib/supabase";

type UserType = "artisan" | "learner" | "customer";

const roles: { value: UserType; label: string; icon: string }[] = [
  { value: "artisan", label: "Artisan", icon: "brush" },
  { value: "learner", label: "Learner", icon: "school" },
  { value: "customer", label: "Customer", icon: "shopping_bag" },
];

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

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Artisan extra fields
  const [industry, setIndustry] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [artisanDesc, setArtisanDesc] = useState("");
  const [experience, setExperience] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  function acquireLocation() {
    setError("");
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          const addr = data.address || {};
          const localArea = addr.village || addr.suburb || addr.town || addr.city || addr.county || "";
          const stateArea = addr.state || "";
          const areaName = [localArea, stateArea].filter(Boolean).join(", ");
          setShopLocation(areaName || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } catch (fetchErr) {
          setShopLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setLocationLoading(false);
      },
      (err) => {
        setError("Failed to get location: " + err.message);
        setLocationLoading(false);
      }
    );
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!avatarFile) {
      setError("Please upload a profile photo.");
      return;
    }
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!userType) {
      setError("Please select a user type.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: userType } },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Signup failed.");
      setLoading(false);
      return;
    }

    const userId = data.user.id;
    let avatarUrl: string | null = null;

    if (avatarFile) {
      const compressed = await compressImage(avatarFile);
      const filePath = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressed, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) {
        setError("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      avatarUrl = urlData.publicUrl;
    }

    const profileUpdate: Record<string, string | null> = {};
    if (avatarUrl) profileUpdate.avatar_url = avatarUrl;
    if (userType === "artisan") {
      profileUpdate.industry = industry;
      profileUpdate.location = shopLocation;
      profileUpdate.description = artisanDesc;
      profileUpdate.experience = experience;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from("profiles").update(profileUpdate).eq("id", userId);
    }

    setLoading(false);
    navigate("/dashboard");
  }

  return (
    <main className={styles.signupPage}>
      <div className={styles.heritagePattern}></div>
      <div className={styles.grainOverlay}></div>

      <div className={styles.bgMotifTopLeft}>
        <img
          className={styles.bgMotifImage}
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrUwE14PcdHETHRaGXQ2F3mYc-YJId2Y4_qcoRaVDcv1O4KPPz05eAALDqlMsnb1eRqjf_2KVi9KfKjjgUXgLFur5GAwd99kok0UElV3tMPFkSEOwJZHIiA8YQ5RkIPDWk3BRHL8A5Jxu__2F17ee-aWkTKzRig7bIWbQ50RURbOIxTAt1mrQiXW2sqz-Zuo737KviwH81YYavmRLd8f7UhFbw7QOs8R82PWn9Eb6Qv85b1L5QcznCZzc82SiYo3Pd7ODAvj9jFzY"
          alt=""
        />
      </div>
      <div className={styles.bgMotifBottomRight}>
        <img
          className={styles.bgMotifImage}
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEXGUpa3W3CGCfI25j1rdLMMp_tANwUfP7ZnJoL3Musi8BABOEZLyRDlRLr71sbvb-y95cKy-uaSua7BmvYLojO1gjwT3nh2JMivH7X8gCJPmvv_YbgjYFyzeecaERViv_C4LfAOk7qilusBIr4VTGEcZjtPJyPAq2Q0fBOmDbNSo9Fl93Nqp5BNSzVWjcFrIZNMiAN7-5NU9Dkl6KpIZuLusljhtnnJzs5Nr51-xibSszZLPRlbWYiFWDgxjxztR2yPPNPUf8ShM"
          alt=""
        />
      </div>

      <div className={styles.signupCard}>
        <div className={styles.blockPrintMotif}></div>

        <div className={styles.cardHeader}>
          <span className={styles.greeting}>नमस्ते</span>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join the Digital Heritage</p>
        </div>

        <form className={styles.form} onSubmit={handleSignup}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer} onClick={() => fileInputRef.current?.click()}>
              <div className={styles.avatarCircle}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className={styles.avatarImg} />
                ) : (
                  <span className={`material-symbols-outlined ${styles.avatarIcon}`}>add_a_photo</span>
                )}
              </div>
              <div className={styles.avatarEditBtn}>
                <span className={`material-symbols-outlined ${styles.avatarEditIcon}`}>edit</span>
              </div>
            </div>
            <label className={styles.avatarLabel}>Upload Profile Portrait</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>

          <div className={styles.inputsGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Full Name <span className={styles.inputLabelHindi}>पूरा नाम</span>
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="Arjun Singh"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Email <span className={styles.inputLabelHindi}>ईमेल</span>
              </label>
              <input
                className={styles.input}
                type="email"
                placeholder="arjun@craftconnect.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Password <span className={styles.inputLabelHindi}>पासवर्ड</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                />
                <span 
                  className="material-symbols-outlined" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--outline)' }}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Confirm Password <span className={styles.inputLabelHindi}>पुष्टि करें</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className={styles.input}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                />
                <span 
                  className="material-symbols-outlined" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--outline)' }}
                >
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.roleSection}>
            <label className={styles.roleLabel}>I am a...</label>
            <div className={styles.roleGrid}>
              {roles.map((role) => (
                <label key={role.value} className={styles.roleOption}>
                  <input
                    className={styles.roleInput}
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={userType === role.value}
                    onChange={(e) => setUserType(e.target.value as UserType)}
                  />
                  <div className={styles.roleCard}>
                    <span className={`material-symbols-outlined ${styles.roleIcon}`}>{role.icon}</span>
                    <span className={styles.roleName}>{role.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {userType === "artisan" && (
            <div className={styles.artisanSection}>
              <select
                className={styles.select}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">Select Industry</option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              >
                <option value="">Select Experience</option>
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="Less than 5 years">Less than 5 years</option>
                <option value="Less than 10 years">Less than 10 years</option>
                <option value="Greater than 10 years">Greater than 10 years</option>
              </select>
              <button
                type="button"
                className={styles.input}
                style={{ 
                  cursor: "pointer", 
                  textAlign: "center", 
                  border: "2px solid var(--primary)",
                  backgroundColor: shopLocation ? "var(--primary)" : "transparent",
                  color: shopLocation ? "var(--surface)" : "var(--primary)",
                  fontWeight: "600"
                }}
                onClick={acquireLocation}
                disabled={locationLoading}
              >
                {locationLoading ? "Acquiring GPS..." : shopLocation ? `📍 ${shopLocation}` : "📍 Acquire GPS Location"}
              </button>
              <textarea
                placeholder="Describe your work (optional)..."
                className={styles.textarea}
                value={artisanDesc}
                onChange={(e) => setArtisanDesc(e.target.value)}
                rows={3}
                required={false}
              />
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" inline />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className={styles.loginText}>
          <p>
            Already have an account?
            <span className={styles.loginLink} onClick={() => navigate("/login")}>
              Log in
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default Signup;
