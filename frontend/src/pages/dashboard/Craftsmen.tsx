import CraftsmenCategory from "../../components/craftsmen/CraftsmenCategory";
import styles from "./Craftsmen.module.css";

const craftsmenCategories = [
  {
    title: "Pottery",
    videos: ["Craftsmen", "Craftsmen", "Craftsmen", "Craftsmen"],
  },
  {
    title: "Bamboo Making",
    videos: ["Craftsmen", "Craftsmen", "Craftsmen", "Product"],
  },
  {
    title: "Glass Decorating",
    videos: ["Craftsmen", "Craftsmen", "Craftsmen", "Craftsmen"],
  },
  {
    title: "Painting",
    videos: ["Craftsmen", "Craftsmen", "Craftsmen", "Craftsmen"],
  },
];

function Craftsmen() {
  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Craftsmen</h2>

      {craftsmenCategories.map((category) => (
        <CraftsmenCategory
          key={category.title}
          title={category.title}
          videos={category.videos}
        />
      ))}
    </div>
  );
}

export default Craftsmen;
