import { useState, useEffect } from "react";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password flow state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Full recovery flow state
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (window.location.hash.includes("type=recovery")) {
        setIsRecoveryFlow(true);
      } else if (data.session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryFlow(true);
      } else if (session && !window.location.hash.includes("type=recovery") && !isRecoveryFlow) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isRecoveryFlow]);

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (loading) return;
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

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please provide your email address first.");
      return;
    }

    setLoading(true);
    setError("");
    setResetMessage("");

    // Modern Secure Flow: Send an email with a secure reset link. 
    // They will click it, get securely logged in, and then can change their password in the app.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/login"
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setResetMessage("Recovery secure link sent! Please check your email inbox to proceed.");
    }
  }

  async function handleUpdateRecoveredPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setResetMessage("Password successfully updated! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 2000);
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
            <h2 className={styles.cardTitle}>
              {isRecoveryFlow ? "Set New Password" : (isForgotPassword ? "Reset Password" : "Welcome Back")}
            </h2>
            <p className={styles.cardSubtitle}>
              {isRecoveryFlow ? "Enter your new credentials below" : (isForgotPassword ? "We will send a recovery link securely to your inbox" : "Log in to continue to CraftConnect")}
            </p>
          </div>

          <form className={styles.form} onSubmit={isRecoveryFlow ? handleUpdateRecoveredPassword : (isForgotPassword ? handleResetPassword : handleLogin)}>
            
            {isRecoveryFlow ? (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="new-password">
                  New Password
                </label>
                <div className={styles.inputWrapper} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <input
                    className={styles.input}
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <span 
                    className="material-symbols-outlined" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--outline)' }}
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                  <div className={styles.inputHindiLabel}>नया कूटशब्द</div>
                </div>

                <label className={styles.inputLabel} htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <div className={styles.inputWrapper} style={{ position: 'relative' }}>
                  <input
                    className={styles.input}
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <span 
                    className="material-symbols-outlined" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--outline)' }}
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                  <div className={styles.inputHindiLabel}>पुष्टि करें</div>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="email">
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  id="email"
                  type="email"
                  placeholder="customertor@craftconnect.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className={styles.inputHindiLabel}>ईमेल</div>
              </div>
            </div>
            <div className={styles.inputGroup}>
              {isForgotPassword ? (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                  <span 
                    onClick={() => { setIsForgotPassword(false); setError(""); setResetMessage(""); }}
                    style={{ fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-label)', fontWeight: 600 }}
                  >
                    Back to Login
                  </span>
                </div>
              ) : (
                <>
                  <label className={styles.inputLabel} htmlFor="password">
                    Password
                  </label>
                  <div className={styles.inputWrapper} style={{ position: 'relative' }}>
                    <input
                      className={styles.input}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight: '2.5rem' }}
                      required
                    />
                    <span 
                      className="material-symbols-outlined" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--outline)' }}
                    >
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                    <div className={styles.inputHindiLabel}>कूटशब्द</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <span 
                      onClick={() => { setIsForgotPassword(true); setError(""); setResetMessage(""); }}
                      style={{ fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-label)', fontWeight: 600 }}
                    >
                      Forgot Password?
                    </span>
                  </div>
                </>
              )}
            </div>
            </>
            )}

            {resetMessage && (
                <p style={{ color: "green", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  {resetMessage}
                </p>
              )}

              {error && (
                <p style={{ color: "var(--error, #ba1a1a)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  {error}
                </p>
              )}

            {!isForgotPassword && !isRecoveryFlow && (
              <div className={styles.optionsRow}>
                <label className={styles.rememberMe}>
                  <input className={styles.checkbox} type="checkbox" />
                  <span>REMEMBER ME</span>
                </label>
              </div>
            )}

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? "PROCESSING..." : (isRecoveryFlow ? "SAVE NEW PASSWORD" : (isForgotPassword ? "SEND RESET LINK" : "LOGIN"))}
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
        <p className={styles.copyright}>
          © 2026 CraftConnect. Handcrafted in India.
        </p>
      </footer>

      <div className={styles.bottomTexture}></div>
    </div>
  );
}

export default Login;
