import { useState, useEffect } from "react";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // Manually set the session using the query params from Brevo
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        if (error) {
          setError("Recovery link is invalid or expired. Please request a new one.");
        } else {
          setSessionReady(true);
          // Safely hide the tokens from the URL bar
          window.history.replaceState(null, "", window.location.pathname);
        }
      });
    } else {
      // If they somehow arrive here natively and already have a session, we let them proceed.
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setSessionReady(true);
        } else {
          setError("No recovery token found. Please click the link in your email.");
        }
      });
    }
  }, []);

  async function handleUpdateRecoveredPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionReady) return;

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
    
    // Update the user's password using the active recovery session
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
    } else {
      setResetMessage("Password successfully updated! Redirecting to login...");
      // Once the password is changed, log them out to clear the recovery session
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 2000);
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
            <h2 className={styles.cardTitle}>SET NEW PASSWORD</h2>
            <p className={styles.cardSubtitle} style={{ fontFamily: 'var(--font-body)', color: 'rgba(43, 32, 23, 0.7)', fontStyle: 'italic', fontSize: '0.875rem' }}>
              Enter your new credentials below
            </p>
          </div>

          <form className={styles.form} onSubmit={handleUpdateRecoveredPassword}>
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
                  disabled={!sessionReady || loading}
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
                  disabled={!sessionReady || loading}
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

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading || !sessionReady}
              style={{ marginTop: '1.5rem' }}
            >
              {loading ? "SAVING..." : "SAVE PASSWORD"}
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <span 
                onClick={() => navigate("/login")}
                style={{ fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-label)', fontWeight: 600 }}
              >
                Return to Login
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default ResetPassword;
