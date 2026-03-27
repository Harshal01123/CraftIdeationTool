import { useState } from "react";
import styles from "./RatingModal.module.css";

type RatingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  existingRating?: number;
  existingComment?: string;
  title?: string; // e.g. "Rate this Artisan" or "Rate this Product"
  isProcessing?: boolean;
};

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  existingRating = 0,
  existingComment = "",
  title = "Leave a Rating",
  isProcessing = false,
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating);
  const [comment, setComment] = useState(existingComment);
  const [hovered, setHovered] = useState(0);

  if (!isOpen) return null;

  const displayRating = hovered || rating;

  async function handleSubmit() {
    if (rating === 0) return;
    await onSubmit(rating, comment);
  }

  const labels = ["Unrated", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className={styles.iconWrap}>
          <span
            className="material-symbols-outlined"
            style={{
              fontVariationSettings: "'FILL' 1",
              color: "#c9962a",
              fontSize: "2rem",
            }}
          >
            star
          </span>
        </div>

        <h2 className={styles.title}>{title}</h2>

        <div className={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`material-symbols-outlined ${styles.bigStar}`}
              style={{
                fontVariationSettings:
                  displayRating >= star ? "'FILL' 1" : "'FILL' 0",
                color: displayRating >= star ? "#c9962a" : "#dac1b8",
              }}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
            >
              star
            </span>
          ))}
        </div>

        <p className={styles.label}>
          {displayRating > 0 ? labels[displayRating] : "\u00A0"}
        </p>

        <textarea
          className={styles.textarea}
          placeholder="Share your experience (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={rating === 0 || isProcessing}
          >
            {isProcessing
              ? "Submitting…"
              : existingRating
                ? "Update Rating"
                : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
