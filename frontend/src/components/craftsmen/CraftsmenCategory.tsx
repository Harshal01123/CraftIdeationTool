import CraftsmenCard from "./CraftsmenCard.tsx";
import styles from "./CraftsmenCategory.module.css";

type CraftsmenCategoryProps = {
  title: string;
  videos: string[];
};

function CraftsmenCategory({ title, videos }: CraftsmenCategoryProps) {
  return (
    <section className={styles.category}>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.grid}>
        {videos.map((video) => (
          <CraftsmenCard key={video} title={video} />
        ))}
      </div>
    </section>
  );
}

export default CraftsmenCategory ;