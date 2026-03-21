import { useState, useEffect } from "react";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";
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

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message || authError.code || JSON.stringify(authError));
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className={styles.loginPage}>
      <div
        className={styles.heritagePattern}
        data-alt="Intricate terracotta Indian block print textile pattern"
      ></div>
      <div className={styles.paperGrain}></div>

      <header className={styles.header}>
        <h1 className={styles.headerTitle}>
          CraftConnect
        </h1>
      </header>

      <main className={styles.main}>
        <div className={styles.loginCard}>
          <div className={styles.decorativeBorderTop}></div>
          <div className={styles.decorativeBorderBottom}></div>

          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>LOGIN</h2>
            <div className={styles.swagatam}>
              <span className={styles.swagatamLine}></span>
              <span className={styles.swagatamText}>स्वागतम्</span>
              <span className={styles.swagatamLine}></span>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="email">
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  id="email"
                  type="email"
                  placeholder="curator@craftconnect.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className={styles.inputHindiLabel}>ईमेल</div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="password">
                Password
              </label>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className={styles.inputHindiLabel}>कूटशब्द</div>
              </div>
              {error && (
                <p
                  style={{
                    color: "var(--error, #ba1a1a)",
                    fontSize: "0.85rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {error}
                </p>
              )}
            </div>

            <div className={styles.optionsRow}>
              <label className={styles.rememberMe}>
                <input className={styles.checkbox} type="checkbox" />
                <span>REMEMBER ME</span>
              </label>
              <a className={styles.forgotPwd} href="#forgot">
                FORGOT PASSWORD?
              </a>
            </div>

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>

          <div className={styles.signupText}>
            <p>
              New here?{" "}
              <span
                className={styles.signupLink}
                onClick={() => navigate("/signup")}
              >
                SIGNUP!
              </span>
            </p>
            <div className={styles.decorContainer}>
              <span className={`material-symbols-outlined ${styles.decorIcon}`}>
                filter_vintage
              </span>
              <span className={`material-symbols-outlined ${styles.decorIcon}`}>
                filter_vintage
              </span>
              <span className={`material-symbols-outlined ${styles.decorIcon}`}>
                filter_vintage
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#contact">Contact</a>
        </div>
        <p className={styles.copyright}>
          © 2024 CraftConnect. Handcrafted in India.
        </p>
      </footer>

      <div className={styles.bottomTexture}></div>
    </div>
  );
}

export default Login;
