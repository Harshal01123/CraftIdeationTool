import { useState, useEffect } from "react";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If user is already logged in, skip the login page entirely
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/dashboard");
      }
    });
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
  }

  // Allow submitting with Enter key on either input
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>LOGIN</h1>

        <div className={styles.form}>
          <input
            type="email"
            placeholder="Enter email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <input
            type="password"
            placeholder="Enter password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {error && (
            <p style={{ color: "red", fontSize: "0.85rem", margin: 0 }}>
              {error}
            </p>
          )}

          <Button variant="secondary" onClick={handleLogin}>
            {loading ? "Logging in..." : "LOGIN"}
          </Button>

          <p className={styles.signupText}>
            New here?{" "}
            <Button variant="secondary" onClick={() => navigate("/signup")}>
              SIGNUP!
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;