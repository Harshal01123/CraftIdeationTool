import { type Message } from "../../types/chat";
import styles from "./MessageBubble.module.css";

interface Props {
  message: Message;
  currentUserId: string;
}

function MessageBubble({ message, currentUserId }: Props) {
  const isMine = message.sender_id === currentUserId;
  const isSystem = message.type === "SYSTEM";

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // System messages
  if (isSystem) {
    return (
      <div className={styles.systemWrap}>
        <p className={styles.systemMsg}>{message.content}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.wrap} ${isMine ? styles.mine : styles.theirs}`}>
      <div
        className={`${styles.bubble} ${
          isMine ? styles.bubbleMine : styles.bubbleTheirs
        }`}
      >
        <p className={styles.content}>{message.content}</p>
        <span className={styles.time}>{time}</span>
      </div>
    </div>
  );
}

export default MessageBubble;
