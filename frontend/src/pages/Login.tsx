import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

function Login() {
  const navigate = useNavigate();

  return (
    <div className={styles.loginPage}>
      <div className ={styles.loginCard}>
      <h1 className={styles.title}>LOGIN</h1>

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Enter username"
          className={styles.input}
        />

        <input
          type="password"
          placeholder="Enter password"
          className={styles.input}
        />

        <Button variant = "secondary" onClick={() => navigate("/dashboard")}>
          LOGIN
        </Button>

        <p className={styles.signupText}>
          New here?{" "}
          <Button variant = "secondary"
            onClick={() => navigate("/signup")}
          >
            SIGNUP!
          </Button>
        </p>
      </div>
      </div>
    </div>
  );
}

export default Login;
