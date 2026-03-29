import { type Message, type OfferPayload } from "../../types/chat";
import OfferCard from "./OfferCard";
import styles from "./MessageBubble.module.css";

interface Props {
  message: Message;
  currentUserId: string;
  isArtisan: boolean;
  isLatestPendingOffer: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onBargain?: () => void;
  onMakeNewOffer?: () => void;
  disabled?: boolean;
}

const REJECTED_BY_PREFIX = "REJECTED_BY:";

function MessageBubble({
  message,
  currentUserId,
  isArtisan,
  isLatestPendingOffer,
  onAccept,
  onReject,
  onBargain,
  onMakeNewOffer,
  disabled,
}: Props) {
  const isMine = message.sender_id === currentUserId;
  const isSystem = message.type === "SYSTEM";
  const isOffer = message.type === "OFFER";

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // System messages
  if (isSystem) {
    const raw = message.content;

    // Rejection messages
    if (raw.startsWith(REJECTED_BY_PREFIX)) {
      const pipe = raw.indexOf("|");
      const rejectorId = raw.slice(REJECTED_BY_PREFIX.length, pipe);
      const baseText = raw.slice(pipe + 1);
      const iAmRejector = rejectorId === currentUserId;

      const displayText = iAmRejector
        ? `\u274c You declined ${baseText.slice(baseText.indexOf(" declined ") + 10)}`
        : `\u274c ${baseText}`;

      return (
        <div className={styles.systemWrap}>
          <p className={styles.systemMsg}>{displayText}</p>
          {/* Nudge for customer who received the rejection */}
          {!iAmRejector && !isArtisan && onMakeNewOffer && (
            <button
              onClick={onMakeNewOffer}
              style={{
                marginTop: "0.5rem",
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                background: "var(--primary, #8b4513)", color: "#fff",
                border: "none", borderRadius: "0.5rem",
                padding: "0.35rem 0.75rem",
                fontSize: "0.65rem", fontFamily: "var(--font-label, sans-serif)",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                cursor: "pointer", transition: "opacity 0.2s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "0.85rem" }}>local_offer</span>
              Make New Offer
            </button>
          )}
        </div>
      );
    }

    // Closed chat messages (encoded as: CLOSED_BY:<id>|closed the chat.)
    if (raw.startsWith("CLOSED_BY:")) {
      const pipe = raw.indexOf("|");
      const closerId = raw.slice("CLOSED_BY:".length, pipe);
      const iAmCloser = closerId === currentUserId;
      const otherRole = isArtisan ? "Customer" : "Artisan";
      
      const displayText = iAmCloser
        ? `You closed the chat.`
        : `${otherRole} closed the chat.`;
        
      return (
        <div className={styles.systemWrap}>
          <p className={styles.systemMsg} style={{ fontWeight: 600 }}>{displayText}</p>
        </div>
      );
    }

    return (
      <div className={styles.systemWrap}>
        <p className={styles.systemMsg}>{raw}</p>
      </div>
    );
  }

  // Offer messages
  if (isOffer) {
    let payload: OfferPayload | null = null;
    try { payload = JSON.parse(message.content) as OfferPayload; } catch { /* skip */ }
    if (!payload) return null;

    return (
      <div className={`${styles.wrap} ${isMine ? styles.mine : styles.theirs}`}>
        <div className={styles.metaRow} style={{ marginBottom: "0.35rem" }}>
          <span className={styles.time}>{time}</span>
          {isMine && <span className={styles.name}>You</span>}
        </div>
        <OfferCard
          payload={payload}
          isMine={isMine}
          isLatestPendingOffer={isLatestPendingOffer}
          isArtisan={isArtisan}
          onAccept={onAccept}
          onReject={onReject}
          onBargain={onBargain}
          disabled={disabled}
        />
      </div>
    );
  }

  // Regular text messages
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
            <span className={styles.time}>{time}</span>
          )}
        </div>
        <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
          <p className={styles.content}>{message.content}</p>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
