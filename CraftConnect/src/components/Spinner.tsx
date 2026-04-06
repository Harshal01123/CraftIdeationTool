import { ThreeDots } from "react-loader-spinner";
import { useTranslation } from "react-i18next";
import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  inline?: boolean;
}

function Spinner({ size = "md", label, inline = false }: SpinnerProps) {
  const { t } = useTranslation();
  const dimension = size === "sm" ? "30" : size === "lg" ? "80" : "50";
  
  return (
    <div
      className={`${styles.container} ${inline ? styles.inline : styles.block}`}
      role="status"
      aria-live="polite"
      aria-label={label ?? t("extended.loadingFallback")}
      style={{ 
        display: "flex", 
        flexDirection: inline ? "row" : "column", 
        alignItems: "center", 
        justifyContent: "center", 
        gap: "0.5rem" 
      }}
    >
      <ThreeDots
        visible={true}
        height={dimension}
        width={dimension}
        color="#823b18"
        radius="9"
        ariaLabel="three-dots-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

export default Spinner;
