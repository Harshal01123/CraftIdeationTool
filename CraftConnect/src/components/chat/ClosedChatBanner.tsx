import Button from "../Button";
import styles from "./ClosedChatBanner.module.css";

interface Props {
  onStartNew?: () => void;
}

function ClosedChatBanner({ onStartNew }: Props) {
  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        🔒 This conversation is closed. No new messages can be sent.
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
