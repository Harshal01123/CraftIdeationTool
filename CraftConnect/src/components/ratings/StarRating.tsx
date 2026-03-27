import styles from "./StarRating.module.css";

type StarRatingProps = {
  value: number;        // 0–5, supports decimals for display
  onChange?: (v: number) => void; // if omitted → read-only
  size?: "sm" | "md" | "lg";
};

export default function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  function getVariation(star: number): string {
    if (value >= star) return "'FILL' 1";
    if (value >= star - 0.5) return "'FILL' 0"; // half star shows outline
    return "'FILL' 0";
  }

  function getColor(star: number): string {
    return value >= star - 0.49 ? "#c9962a" : "#dac1b8";
  }

  return (
    <span className={`${styles.row} ${styles[size]}`}>
      {stars.map((star) => (
        <span
          key={star}
          className={`material-symbols-outlined ${styles.star} ${onChange ? styles.interactive : ""}`}
          style={{ fontVariationSettings: getVariation(star), color: getColor(star) }}
          onClick={() => onChange?.(star)}
          onMouseEnter={(e) => {
            if (!onChange) return;
            // highlight on hover handled via CSS sibling trick isn't possible with runtime colors,
            // so we just let onclick handle the interaction
            (e.currentTarget as HTMLElement).style.color = "#a0522d";
          }}
          onMouseLeave={(e) => {
            if (!onChange) return;
            (e.currentTarget as HTMLElement).style.color = getColor(star);
          }}
        >
          star
        </span>
      ))}
    </span>
  );
}
