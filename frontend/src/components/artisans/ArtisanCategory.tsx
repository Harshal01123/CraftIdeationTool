import ArtisanCard from "./ArtisanCard";
import styles from "./ArtisanCategory.module.css";
import type { Profile } from "../../types/chat";

type ArtisanCategoryProps = {
  title: string;
  artisans: Profile[];
};

function ArtisanCategory({ title, artisans }: ArtisanCategoryProps) {
  return (
    <section className={styles.category}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>
        {artisans.map((artisan) => (
          <ArtisanCard key={artisan.id} artisan={artisan} />
        ))}
      </div>
    </section>
  );
}

export default ArtisanCategory;
