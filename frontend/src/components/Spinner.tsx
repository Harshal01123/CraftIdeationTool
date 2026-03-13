import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  inline?: boolean;
}

function Spinner({ size = "md", label, inline = false }: SpinnerProps) {
  return (
    <div
      className={`${styles.container} ${inline ? styles.inline : styles.block}`}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <span className={`${styles.dot} ${styles[size]}`} aria-hidden="true" />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

export default Spinner;
