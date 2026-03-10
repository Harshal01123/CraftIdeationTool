import { useEffect, useRef, useState } from "react";
import { type Profile } from "../../types/chat";
import { useChat } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import ClosedChatBanner from "./ClosedChatBanner";
import Button from "../Button";
import styles from "./ChatWindow.module.css";

interface Props {
  conversationId: string;
  currentProfile: Profile;
}

function ChatWindow({ conversationId, currentProfile }: Props) {
  const { messages, conversation, loading, sendMessage, closeConversation } =
    useChat(conversationId, currentProfile);

  const [showConfirm, setShowConfirm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message every time messages array updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleClose() {
    await closeConversation();
    setShowConfirm(false);
  }

  if (loading) {
    return <div className={styles.status}>Loading messages...</div>;
  }

  if (!conversation) {
    return <div className={styles.status}>Could not load conversation.</div>;
  }

  // Show the OTHER person's name in the header
  const other =
    currentProfile.role === "artisan"
      ? conversation.customer
      : conversation.artisan;

  return (
    <div className={styles.window}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{conversation.title}</h3>
          <p className={styles.subtitle}>{other?.name ?? "Unknown"}</p>
        </div>

        {/* Close button — only shown when OPEN and confirm not triggered */}
        {conversation.status === "OPEN" && !showConfirm && (
          <Button variant="secondary" onClick={() => setShowConfirm(true)}>
            Close Conversation
          </Button>
        )}

        {/* Confirmation row — appears after clicking Close */}
        {showConfirm && (
          <div className={styles.confirmRow}>
            <span className={styles.confirmText}>
              Cannot be reopened. Are you sure?
            </span>
            <Button onClick={handleClose}>Yes, Close</Button>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
          </div>
        )}

        {/* Archived badge — shown when CLOSED */}
        {conversation.status === "CLOSED" && (
          <span className={styles.closedBadge}>Archived</span>
        )}
      </div>

      {/* Message list — scrollable */}
      <div className={styles.messageList}>
        {messages.length === 0 && (
          <p className={styles.noMessages}>No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentUserId={currentProfile.id}
          />
        ))}
        {/* Invisible div at the bottom — scrolled into view on new message */}
        <div ref={bottomRef} />
      </div>

      {/* Footer — switches between input and closed banner based on status */}
      {conversation.status === "OPEN" ? (
        <ChatInput onSend={sendMessage} />
      ) : (
        <ClosedChatBanner />
      )}
    </div>
  );
}

export default ChatWindow;
