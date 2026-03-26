import { useState } from "react";
import Spinner from "../Spinner";
import styles from "./ContactDialog.module.css";

type ContactDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  artisanName?: string;
  productName?: string;
  isProcessing?: boolean;
  onSubmit: (messageText: string) => void;
  mode: "order" | "chat";
};

function ContactDialog({
  isOpen,
  onClose,
  artisanName,
  productName,
  isProcessing,
  onSubmit,
  mode,
}: ContactDialogProps) {
  const [messageText, setMessageText] = useState("");

  if (!isOpen) return null;

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog}>
        <h3>{mode === "order" ? "Contact Artisan" : `Chat with ${artisanName}`}</h3>
        <p>
          {mode === "order" ? (
            <>
              Start a chat with <strong>{artisanName}</strong> to order{" "}
              <strong>{productName}</strong>.
            </>
          ) : (
            `Send a message to ${artisanName} to start a conversation.`
          )}
        </p>

        <textarea
          className={styles.dialogInput}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={
            mode === "order"
              ? "Type a short message to artisan (optional)..."
              : "Type your message here..."
          }
          rows={3}
        />

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
              <Spinner size="sm" inline label="Starting Chat..." />
            ) : mode === "order" ? (
              "Start Order Chat"
            ) : (
              "Send Message"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContactDialog;
