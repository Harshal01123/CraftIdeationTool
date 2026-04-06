import styles from "./Card.module.css";
import { useTranslation } from "react-i18next";

type CourseCardProps = {
  title: string;
  duration?: string;
  onClick?: () => void;
};

function CourseCard({ title, duration = "10 mins", onClick }: CourseCardProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.thumbnail} />
      <h4>{title}</h4>
      <p>{t("extended.duration")}: {duration}</p>
    </div>
  );
}

export default CourseCard;
