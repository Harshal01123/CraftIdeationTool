import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import styles from "./Messages.module.css";

function Messages() {
  const { profile, authLoading } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!profile) {
    return (
      <div className={styles.loading}>Please log in to view messages.</div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Left: conversation list */}
      <ChatSidebar
        currentProfile={profile}
        activeConversationId={activeConversationId}
        onSelect={setActiveConversationId}
      />

      {/* Right: active chat window */}
      <div className={styles.windowArea}>
        {activeConversationId ? (
          // key forces a clean remount when switching conversations
          // this resets scroll position and opens a fresh realtime channel
          <ChatWindow
            key={activeConversationId}
            conversationId={activeConversationId}
            currentProfile={profile}
          />
        ) : (
          <div className={styles.empty}>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
