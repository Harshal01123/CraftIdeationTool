import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  inline?: boolean;
}

function Spinner({ size = "md", label, inline = false }: SpinnerProps) {
  const showBranded = !inline && size !== "sm";

  if (showBranded) {
    return (
      <div className={styles.brandedContainer} role="status" aria-live="polite" aria-label={label ?? "Loading"}>
        <img 
          alt="CraftConnect Loading Spinner" 
          className={styles.brandedIcon} 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVrI1BuKrQO377oBOB2EMlpmZH3Da-qYcbufu3pnqkyUpdQ__K5ZZoHZipkZyCEhwcseuoEcStw1lyM_RgiaSYwk-OuESQ_3SDxtrkjKu95dCotXHGu_YtDo_Oi0N6aDWdezZYYJT60VxDCFIEQBSvQEtGtM9Cv8lsHrqwEY-Ml5VXeg85lpp7e2hG5bf-KTJObCA6HbQMcbePIcxAUBevqrSyTUb4rdsCNnnz63esECv8TzvrMk3uUjbXp1zy7Cd-HY6yQEbTBnQ" 
        />
        <div className={styles.brandedTextWrapper}>
          <p className={styles.brandedHindi}>तैयारी...</p>
          <p className={styles.brandedLabel}>{label ?? "Curating your workspace"}</p>
        </div>
      </div>
    );
  }

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
