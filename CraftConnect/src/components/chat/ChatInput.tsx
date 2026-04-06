import { useState } from "react";
import Button from "../Button";
import styles from "./ChatInput.module.css";
import { useTranslation } from "react-i18next";

interface Props {
  onSend: (content: string) => void;
  onReOffer?: () => void;
}

function ChatInput({ onSend, onReOffer }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    onSend(text);
    setText(""); // clear input after sending
  }

  // Allow sending with Enter key
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className={styles.container}>
      <input
        className={styles.input}
        type="text"
        placeholder={t("extended.typeMessage")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {onReOffer && (
        <button
          className={styles.reOfferBtn}
          onClick={onReOffer}
          title="Make New Offer"
          type="button"
        >
          <span className="material-symbols-outlined">local_offer</span>
        </button>
      )}
      <Button onClick={handleSend}>Send</Button>
    </div>
  );
}

export default ChatInput;
