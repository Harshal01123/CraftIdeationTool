import { useNavigate } from "react-router-dom";
import styles from "./ArtisanCard.module.css";
import type { Profile } from "../../types/chat";
import StarRating from "../ratings/StarRating";
import { useTranslation } from "react-i18next";

type ArtisanCardProps = {
  artisan: Profile;
  avgRating?: number;
  totalRatings?: number;
};

function ArtisanCard({ artisan, avgRating = 0, totalRatings = 0 }: ArtisanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/dashboard/artisans/${artisan.id}`)}
    >
      {artisan.avatar_url ? (
        <img
          src={artisan.avatar_url}
          alt={artisan.name}
          className={styles.thumbnail}
        />
      ) : (
        <div className={styles.thumbnailFallback} />
      )}

      <div className={styles.info}>
        <h3 className={styles.name}>{artisan.name}</h3>
        <p className={styles.industry}>{artisan.industry ?? t("extended.masterArtisan")}</p>
        {artisan.location && (
          <p className={styles.location}>📍 {artisan.location}</p>
        )}
        <div className={styles.ratingRow}>
          <StarRating value={avgRating} size="sm" />
          <span className={styles.ratingCount}>
            {totalRatings > 0 ? `(${totalRatings})` : t("extended.noReviews")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ArtisanCard;
