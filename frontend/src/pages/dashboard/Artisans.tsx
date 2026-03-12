import ArtisanCategory from "../../components/artisans/ArtisanCategory";
import styles from "./Artisans.module.css";

const artisanCategories = [
  {
    title: "Pottery",
    artisans: ["Artisan", "Artisan", "Artisan", "Artisan"],
  },
  {
    title: "Bamboo Making",
    artisans: ["Artisan", "Artisan", "Artisan", "Product"],
  },
  {
    title: "Glass Decorating",
    artisans: ["Artisan", "Artisan", "Artisan", "Artisan"],
  },
  {
    title: "Painting",
    artisans: ["Artisan", "Artisan", "Artisan", "Artisan"],
  },
];

function Artisans() {
  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Artisans</h2>

      {artisanCategories.map((category) => (
        <ArtisanCategory
          key={category.title}
          title={category.title}
          artisans={category.artisans}
        />
      ))}
    </div>
  );
}

export default Artisans;
