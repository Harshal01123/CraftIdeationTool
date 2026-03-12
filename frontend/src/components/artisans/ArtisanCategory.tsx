import ArtisanCard from "./ArtisanCard";
import styles from "./ArtisanCategory.module.css";

type ArtisanCategoryProps = {
  title: string;
  artisans: string[];
};

function ArtisanCategory({ title, artisans }: ArtisanCategoryProps) {
  return (
    <section className={styles.category}>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.grid}>
        {artisans.map((artisan) => (
          <ArtisanCard key={artisan} artist={artisan} />
        ))}
      </div>
    </section>
  );
}

export default ArtisanCategory;