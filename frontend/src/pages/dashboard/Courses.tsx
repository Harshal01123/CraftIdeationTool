import CourseCategory from "../../components/courses/CourseCategory";
import styles from "./Courses.module.css";

const courseCategories = [
  {
    title: "Pottery Videos",
    videos: ["Clay Basics", "Wheel Throwing", "Glazing 101", "Advanced Pottery"],
  },
  {
    title: "Bamboo Making Videos",
    videos: ["Bamboo Selection", "Cutting Techniques", "Weaving Basics", "Finishing"],
  },
  {
    title: "Glass Decorating Videos",
    videos: ["Glass Safety", "Color Techniques", "Etching Basics", "Polishing"],
  },
  {
    title: "Painting Videos",
    videos: ["Brush Techniques", "Color Theory", "Acrylic Painting", "Landscape Art"],
  },
];

function Courses() {
  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Courses</h2>

      {courseCategories.map((category) => (
        <CourseCategory
          key={category.title}
          title={category.title}
          videos={category.videos}
        />
      ))}
    </div>
  );
}

export default Courses;