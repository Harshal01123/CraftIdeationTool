import styles from "./Signup.module.css";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Spinner from "../components/Spinner";
import { INDUSTRY_OPTIONS } from "../constants/industryOptions";
import { supabase } from "../lib/supabase";

type UserType = "artisan" | "learner" | "customer";

const roles: { value: UserType; label: string }[] = [
  { value: "artisan", label: "Artisan" },
  { value: "learner", label: "Learner" },
  { value: "customer", label: "Customer" },
];

// Compresses image to max 400x400px, ~80% quality JPEG before upload
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
  const [userType, setUserType] = useState<UserType | null>(null);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Artisan extra fields
  const [industry, setIndustry] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [artisanDesc, setArtisanDesc] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleRole(role: UserType) {
    setUserType((prev) => (prev === role ? null : role));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSignup() {
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

    // 1. Create auth user
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

    // 2. Upload avatar if selected
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

    // 3. Update profile row (trigger already created it)
    const profileUpdate: Record<string, string | null> = {};
    if (avatarUrl) profileUpdate.avatar_url = avatarUrl;
    if (userType === "artisan") {
      profileUpdate.industry = industry;
      profileUpdate.location = shopLocation;
      profileUpdate.description = artisanDesc;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from("profiles").update(profileUpdate).eq("id", userId);
    }

    setLoading(false);
    navigate("/dashboard");
  }

  return (
    <div className={styles.signupPage}>
      <div className={styles.signupCard}>
        <h1 className={styles.title}>Create Account</h1>

        {/* Avatar upload */}
        <div className={styles.avatarSection}>
          <div
            className={styles.avatarPreview}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Preview"
                className={styles.avatarImg}
              />
            ) : (
              <span className={styles.avatarPlaceholder}>+</span>
            )}
          </div>
          <p className={styles.avatarHint}>
            Upload photo <span style={{ color: "#d93025" }}>*</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>

        <div className={styles.fields}>
          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Role selection */}
        <div className={styles.roleSection}>
          <p className={styles.roleLabel}>I am a...</p>
          <div className={styles.roleOptions}>
            {roles.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`${styles.roleOption} ${userType === value ? styles.roleOptionSelected : ""}`}
                onClick={() => toggleRole(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Artisan extra fields */}
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
            <Input
              placeholder="Shop Location"
              value={shopLocation}
              onChange={(e) => setShopLocation(e.target.value)}
            />
            <textarea
              placeholder="Describe your work..."
              className={styles.textarea}
              value={artisanDesc}
              onChange={(e) => setArtisanDesc(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="button"
          className={styles.signupBtn}
          onClick={handleSignup}
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

        <p className={styles.loginText}>
          Already have an account?{" "}
          <span className={styles.loginLink} onClick={() => navigate("/login")}>
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
