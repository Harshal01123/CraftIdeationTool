import styles from "./Signup.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";

function Signup() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<
    "craftsman" | "learner" | "customer" | null
  >(null);

  return (
    <div className={styles.signupPage}>
        <div className={styles.signupCard}>
      <h1 className={styles.title}>SIGNUP</h1>

      {/* Basic Inputs */}
      <Input
        placeholder="Username"
      />

      <Input
        placeholder="Password"
      />

      <Input
        placeholder="Confirm Password"
      />

      {/* User Type Selection */}
      <div className={styles.userTypeSection}>
        <p className={styles.label}>Select User Type</p>

        <div className={styles.userTypeButtons}>
          <Button variant = "secondary"
            active = {userType == "craftsman"}
            onClick={() => setUserType("craftsman")}
          >
            Craftsman
          </Button>

          <Button variant = "secondary"
            active = {userType == "learner"}
            onClick={() => setUserType("learner")}
          >
            Learner
          </Button>

          <Button variant = "secondary"
            active = {userType == "customer"}
            onClick={() => setUserType("customer")}
          >
            Customer
          </Button>
        </div>
      </div>

      {/* Craftsman Extra Fields */}
      {userType === "craftsman" && (
        <div className={styles.craftsmanSection}>
          <h3>Craftsman Details</h3>

          <select className={styles.input}>
            <option value="">Select Industry</option>
            <option>Pottery</option>
            <option>Bamboo</option>
            <option>Glass</option>
            <option>Tiles</option>
            <option>Handloom</option>
          </select>

          <Input
            placeholder="Shop Location"
          />

          <textarea
            placeholder="Describe your work"
            className={styles.input}
          />
        </div>
      )}

      {/* Actions */}
      <Button variant = "secondary"
        onClick={() => navigate("/dashboard")}
      >
        Signup
      </Button>

      <p className={styles.loginText}>
        Registered user?{" "}
        <Button variant = "secondary"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </p>
      </div>
    </div>
  );
}

export default Signup;
