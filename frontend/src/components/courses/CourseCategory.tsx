import CourseCard from "./Card.tsx";
import styles from "./CourseCategory.module.css";

type CourseCategoryProps = {
  title: string;
  videos: string[];
};

function CourseCategory({ title, videos }: CourseCategoryProps) {
  return (
    <section className={styles.category}>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.grid}>
        {videos.map((video) => (
          <CourseCard key={video} title={video} />
        ))}
      </div>
    </section>
  );
}

export default CourseCategory;