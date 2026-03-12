import styles from "./ArtisanCard.module.css";

type ArtisanCardProps = {
  description?: string;
  artist?: string;
};
 
function ArtisanCard({ description = "Expert artisan", artist = "Vaishnavi Kataria" }: ArtisanCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail} />
      <h3>Artist: {artist}</h3>
      <p>Description: {description}</p>
    </div>
  );
}

export default ArtisanCard;
