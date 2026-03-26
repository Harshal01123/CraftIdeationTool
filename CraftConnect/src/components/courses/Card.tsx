import styles from "./Card.module.css";

type CourseCardProps = {
  title: string;
  duration?: string;
  onClick?: () => void;
};

function CourseCard({ title, duration = "10 mins", onClick }: CourseCardProps) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.thumbnail} />
      <h4>{title}</h4>
      <p>Duration: {duration}</p>
    </div>
  );
}

export default CourseCard;
