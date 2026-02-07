import styles from "./Card.module.css";

type CourseCardProps = {
  title: string;
  duration?: string;
};

function CourseCard({ title, duration = "10 mins" }: CourseCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail} />
      <h4>{title}</h4>
      <p>Duration: {duration}</p>
    </div>
  );
}

export default CourseCard;