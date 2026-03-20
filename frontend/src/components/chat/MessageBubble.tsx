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
      <div className={styles.container}>
        <div className={styles.metaRow}>
          {isMine ? (
            <>
              <span className={styles.time}>{time}</span>
              <span className={styles.name}>You</span>
            </>
          ) : (
            <>
              {/* <span className={styles.name}>Sender</span> */}
              <span className={styles.time}>{time}</span>
            </>
          )}
        </div>
        <div
          className={`${styles.bubble} ${
            isMine ? styles.bubbleMine : styles.bubbleTheirs
          }`}
        >
          <p className={styles.content}>{message.content}</p>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
