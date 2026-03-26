import { useState, useEffect } from "react";
import Spinner from "../Spinner";
import styles from "./ContactDialog.module.css";

type ContactDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  artisanName?: string;
  productName?: string;
  isProcessing?: boolean;
  error?: string;
  onSubmit: (messageText: string) => void;
  mode: "order" | "chat" | "new_conversation";
};

function ContactDialog({
  isOpen,
  onClose,
  artisanName,
  productName,
  isProcessing,
  error,
  onSubmit,
  mode,
}: ContactDialogProps) {
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMessageText("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTitle = () => {
    if (mode === "order") return "Contact Artisan";
    if (mode === "new_conversation") return "Start a Conversation";
    return `Chat with ${artisanName || "Artisan"}`;
  };

  const getSubtitle = () => {
    if (mode === "order")
      return (
        <>
          Start a chat with <strong>{artisanName}</strong> to order{" "}
          <strong>{productName}</strong>.
        </>
      );
    if (mode === "new_conversation")
      return "Give this conversation a title to begin.";
    return `Send a message to ${artisanName} to start a conversation.`;
  };

  const getPlaceholder = () => {
    if (mode === "order") return "Type a short message to artisan (optional)...";
    if (mode === "new_conversation") return "e.g. Custom pottery order";
    return "Type your message here...";
  };

  const getButtonText = () => {
    if (mode === "order") return "Start Order Chat";
    if (mode === "new_conversation") return "Create Chat";
    return "Send Message";
  };

  const isInputSingleLine = mode === "new_conversation";

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog}>
        <h3 className={styles.dialogTitle}>{getTitle()}</h3>
        <p className={styles.dialogSubtitle}>{getSubtitle()}</p>

        {isInputSingleLine ? (
          <input
            className={styles.dialogInput}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit(messageText);
            }}
            placeholder={getPlaceholder()}
            autoFocus
          />
        ) : (
          <textarea
            className={styles.dialogInput}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={getPlaceholder()}
            rows={3}
            autoFocus
          />
        )}

        {error && <p className={styles.dialogError}>{error}</p>}

        <div className={styles.dialogActions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={() => onSubmit(messageText)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Spinner size="sm" inline label="Wait..." />
            ) : (
              getButtonText()
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContactDialog;
