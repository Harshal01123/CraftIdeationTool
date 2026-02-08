import CourseCard from "./Card";
import styles from "./CourseCategory.module.css";

type Video = {
  title: string;
  youtubeId: string;
};

type CourseCategoryProps = {
  title: string;
  videos: Video[];
  onCardClick: (id: string) => void;
};

function CourseCategory({ title, videos, onCardClick }: CourseCategoryProps) {
  return (
    <section className={styles.category}>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.grid}>
        {videos.map((video) => (
          <CourseCard
            key={video.youtubeId}
            title={video.title}
            onClick={() => onCardClick(video.youtubeId)}
          />
        ))}
      </div>
    </section>
  );
}

export default CourseCategory;
