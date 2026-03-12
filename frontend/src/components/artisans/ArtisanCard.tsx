import { useNavigate } from "react-router-dom";
import styles from "./ArtisanCard.module.css";
import type { Profile } from "../../types/chat";

type ArtisanCardProps = {
  artisan: Profile;
};

function ArtisanCard({ artisan }: ArtisanCardProps) {
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
        <p className={styles.industry}>{artisan.industry ?? "Artisan"}</p>
        {artisan.location && (
          <p className={styles.location}>📍 {artisan.location}</p>
        )}
      </div>
    </div>
  );
}

export default ArtisanCard;
