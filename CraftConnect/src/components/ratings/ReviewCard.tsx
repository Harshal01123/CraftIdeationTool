import StarRating from "./StarRating";
import styles from "./ReviewCard.module.css";

type ReviewCardProps = {
  reviewerName: string;
  reviewerAvatar?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

export default function ReviewCard({
  reviewerName,
  reviewerAvatar,
  rating,
  comment,
  createdAt,
}: ReviewCardProps) {
  const date = new Date(createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const initials = reviewerName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {reviewerAvatar ? (
            <img src={reviewerAvatar} alt={reviewerName} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarFallback}>{initials}</div>
          )}
        </div>
        <div className={styles.meta}>
          <span className={styles.name}>{reviewerName}</span>
          <div className={styles.ratingRow}>
            <StarRating value={rating} size="sm" />
            <span className={styles.date}>{date}</span>
          </div>
        </div>
      </div>
      {comment && <p className={styles.comment}>{comment}</p>}
    </article>
  );
}
