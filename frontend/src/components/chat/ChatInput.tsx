import { useState } from "react";
import Button from "../Button";
import styles from "./ChatInput.module.css";

interface Props {
  onSend: (content: string) => void;
}

function ChatInput({ onSend }: Props) {
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
        placeholder="Type a message and press Enter..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button onClick={handleSend}>Send</Button>
    </div>
  );
}

export default ChatInput;
