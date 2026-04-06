import Button from "../Button";
import styles from "./ClosedChatBanner.module.css";
import { useTranslation } from "react-i18next";

interface Props {
  onStartNew?: () => void;
}

function ClosedChatBanner({ onStartNew }: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        🔒 {t("extended.chatClosed")}
      </p>
      {onStartNew && (
        <Button variant="secondary" onClick={onStartNew}>
          Start New Project
        </Button>
      )}
    </div>
  );
}

export default ClosedChatBanner;
