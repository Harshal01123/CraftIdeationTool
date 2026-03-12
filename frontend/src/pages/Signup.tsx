import styles from "./Signup.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import { supabase } from "../lib/supabase";

type UserType = "artisan" | "learner" | "customer";

const roles: { value: UserType; label: string }[] = [
  { value: "artisan", label: "Artisan" },
  { value: "learner", label: "Learner" },
  { value: "customer", label: "Customer" },
];

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<UserType | null>(null);
  // Artisan extra fields
  const [industry, setIndustry] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [artisanDesc, setArtisanDesc] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleRole(role: UserType) {
    setUserType((prev) => (prev === role ? null : role));
  }

  async function handleSignup() {
    setError("");

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

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Update artisan-specific profile fields after trigger creates the row
    if (userType === "artisan" && data.user) {
      await supabase
        .from("profiles")
        .update({ industry, location: shopLocation, description: artisanDesc })
        .eq("id", data.user.id);
    }

    setLoading(false);
    navigate("/dashboard");
  }

  return (
    <div className={styles.signupPage}>
      <div className={styles.signupCard}>
        <h1 className={styles.title}>Create Account</h1>

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
              <option>Pottery</option>
              <option>Bamboo</option>
              <option>Glass</option>
              <option>Tiles</option>
              <option>Handloom</option>
              <option>Painting</option>
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
          {loading ? "Creating account..." : "Sign Up"}
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
