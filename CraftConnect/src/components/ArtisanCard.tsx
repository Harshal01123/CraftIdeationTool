import styles from "./ArtisanCard.module.css";

type ArtisanCardProps = {
  name: string;
  specialty: string;
};

function ArtisanCard({ name, specialty}: ArtisanCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.img}></div>
      <h2>{name}</h2>
      <p>{specialty}</p>
    </div>
  );
}

export default ArtisanCard;
