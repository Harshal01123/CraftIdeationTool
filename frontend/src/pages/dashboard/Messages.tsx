import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import styles from "./Messages.module.css";

function Messages() {
  const { profile, authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  // Auto-open conversation if ?conversation=<id> is in the URL
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId) {
      setActiveConversationId(convId);
      // Clean the param from the URL without a page reload
      setSearchParams({}, { replace: true });
    }
  }, []);

  function handleSelect(id: string) {
    setActiveConversationId(id);
  }

  if (authLoading) return <div className={styles.loading}>Loading...</div>;

  if (!profile)
    return (
      <div className={styles.loading}>Please log in to view messages.</div>
    );

  return (
    <div className={styles.container}>
      <ChatSidebar
        currentProfile={profile}
        activeConversationId={activeConversationId}
        onSelect={handleSelect}
      />
      <div className={styles.windowArea}>
        {activeConversationId ? (
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
