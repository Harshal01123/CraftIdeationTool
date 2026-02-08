import styles from "./CraftsmenCard.module.css";

type CraftsmenCardProps = {
  description?: string;
  artist?: string ;
};

function CraftsmenCard({description = "Expert artisan", artist = "Vaishnavi Kataria" }: CraftsmenCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail} />
      <h3>Artist: {artist}</h3>
      <p>Description: {description}</p>
    </div>
  );
}

export default CraftsmenCard;
