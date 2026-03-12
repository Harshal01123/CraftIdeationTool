import styles from "./Signup.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";

type UserType = "artisan" | "learner" | "customer";

// Maps UI label to the role value stored in the profiles table
const roleMap: Record<UserType, string> = {
  artisan: "artisan",
  learner: "learner",
  customer: "customer",
};

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!userType) {
      setError("Please select a user type");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: roleMap[userType],
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className={styles.signupPage}>
      <div className={styles.signupCard}>
        <h1 className={styles.title}>SIGNUP</h1>

        {/* Basic Inputs */}
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

        {/* User Type Selection */}
        <div className={styles.userTypeSection}>
          <p className={styles.label}>Select User Type</p>
          <div className={styles.userTypeButtons}>
            <Button
              variant="secondary"
              active={userType === "artisan"}
              onClick={() => setUserType("artisan")}
            >
              Artisan
            </Button>
            <Button
              variant="secondary"
              active={userType === "learner"}
              onClick={() => setUserType("learner")}
            >
              Learner
            </Button>
            <Button
              variant="secondary"
              active={userType === "customer"}
              onClick={() => setUserType("customer")}
            >
              Customer
            </Button>
          </div>
        </div>

        {/* Artisan Extra Fields */}
        {userType === "artisan" && (
          <div className={styles.artisanSection}>
            <h3>Artisan Details</h3>
            <select className={styles.input}>
              <option value="">Select Industry</option>
              <option>Pottery</option>
              <option>Bamboo</option>
              <option>Glass</option>
              <option>Tiles</option>
              <option>Handloom</option>
            </select>
            <Input placeholder="Shop Location" />
            <textarea
              placeholder="Describe your work"
              className={styles.input}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p style={{ color: "red", fontSize: "0.85rem", margin: 0 }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <Button variant="secondary" onClick={handleSignup}>
          {loading ? "Signing up..." : "Signup"}
        </Button>

        <p className={styles.loginText}>
          Registered user?{" "}
          <Button variant="secondary" onClick={() => navigate("/login")}>
            Login
          </Button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
