import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Profile, Purchase } from "../../types/chat";
import { useChat } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import ClosedChatBanner from "./ClosedChatBanner";
import Button from "../Button";
import Spinner from "../Spinner";
import styles from "./ChatWindow.module.css";

interface Props {
  conversationId: string;
  currentProfile: Profile;
}

function ChatWindow({ conversationId, currentProfile }: Props) {
  const { messages, conversation, loading, sendMessage, closeConversation } =
    useChat(conversationId, currentProfile);

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const normalizedRole = String(currentProfile.role || "")
    .trim()
    .toLowerCase();
  const isCustomer = normalizedRole === "customer";
  const isArtisan = normalizedRole === "artisan";

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch purchase details
  useEffect(() => {
    async function fetchPurchase() {
      const { data } = await supabase
        .from("purchases")
        .select("*, product:products(name, price)")
        .eq("conversation_id", conversationId)
        .maybeSingle();

      setPurchase(data as Purchase);
    }
    fetchPurchase();
  }, [conversationId]);

  // Real-time purchase updates
  useEffect(() => {
    if (!purchase?.id) return;

    const channel = supabase
      .channel(`purchase-${purchase.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "purchases",
          filter: `id=eq.${purchase.id}`,
        },
        (payload) => {
          setPurchase((prev) => (prev ? { ...prev, ...payload.new } : null));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [purchase?.id]);

  async function handleClose() {
    await closeConversation();
    setShowConfirm(false);
  }

  async function handleOrderConfirmation(side: "customer" | "artisan") {
    if (!purchase || isUpdating) return;

    const actsAsCustomer =
      purchase.customer_id === currentProfile.id || isCustomer;
    const actsAsArtisan =
      purchase.artisan_id === currentProfile.id || isArtisan;

    if (side === "customer" && !actsAsCustomer) return;
    if (side === "artisan" && !actsAsArtisan) return;

    if (actsAsCustomer && purchase.confirmed_by_customer) return;
    if (actsAsArtisan && purchase.confirmed_by_artisan) return;
    if (!actsAsCustomer && !actsAsArtisan) return;

    setIsUpdating(true);

    const updates: Partial<Purchase> = {};
    if (side === "customer") {
      updates.confirmed_by_customer = true;
    } else {
      updates.confirmed_by_artisan = true;
    }

    // Optimistic update
    setPurchase((prev) => (prev ? { ...prev, ...updates } : null));

    let confirmQuery = supabase
      .from("purchases")
      .update(updates)
      .eq("id", purchase.id);
    if (side === "customer") {
      confirmQuery = confirmQuery.eq("confirmed_by_customer", false);
    } else {
      confirmQuery = confirmQuery.eq("confirmed_by_artisan", false);
    }

    const { error } = await confirmQuery;

    if (error) {
      console.error("Error updating purchase:", error);
      setIsUpdating(false);
      return;
    }

    const { data: freshPurchase } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", purchase.id)
      .maybeSingle();

    const latest = freshPurchase as Purchase | null;
    if (latest) setPurchase(latest);

    const bothConfirmed =
      Boolean(latest?.confirmed_by_customer) &&
      Boolean(latest?.confirmed_by_artisan);

    if (bothConfirmed) {
      const { error: completeError } = await supabase
        .from("purchases")
        .update({ status: "completed" })
        .eq("id", purchase.id)
        .neq("status", "completed");

      if (!completeError) {
        await sendMessage(
          "Order confirmed by both parties! Transaction completed.",
          "SYSTEM",
        );
        setPurchase((prev) => (prev ? { ...prev, status: "completed" } : prev));
      }
    } else {
      await sendMessage(
        side === "customer"
          ? "Customer confirmed receipt. Waiting for artisan payment confirmation."
          : "Artisan confirmed payment received. Waiting for customer receipt confirmation.",
        "SYSTEM",
      );
    }
    setIsUpdating(false);
  }

  if (loading) {
    return (
      <div className={styles.status}>
        <Spinner label="Loading messages..." />
      </div>
    );
  }

  if (!conversation) {
    return <div className={styles.status}>Could not load conversation.</div>;
  }

  const other = isArtisan ? conversation.customer : conversation.artisan;

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className={styles.title}>{other?.name || "Chat"}</span>
          {conversation.title && (
            <span className={styles.subtitle}>{conversation.title}</span>
          )}
        </div>

        {conversation.status === "OPEN" ? (
          !showConfirm ? (
            <Button variant="secondary" onClick={() => setShowConfirm(true)}>
              End Chat
            </Button>
          ) : (
            <div className={styles.confirmRow}>
              <span className={styles.confirmText}>Are you sure?</span>
              <Button variant="secondary" onClick={handleClose}>
                Yes
              </Button>
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                No
              </Button>
            </div>
          )
        ) : (
          <span className={styles.closedBadge}>Archived</span>
        )}
      </div>

      {/* Order Action Panel */}
      {purchase && (
        <div className={styles.orderPanel}>
          <div className={styles.orderInfo}>
            <span>
              Order: <strong>{purchase.product?.name}</strong>
            </span>
            <span>₹{purchase.total_price}</span>
          </div>

          <div className={styles.orderStatus}>
            <div
              className={
                purchase.confirmed_by_customer
                  ? styles.stepDone
                  : styles.stepPending
              }
            >
              CUST: {purchase.confirmed_by_customer ? "Received" : "Pending"}
            </div>
            <div
              className={
                purchase.confirmed_by_artisan
                  ? styles.stepDone
                  : styles.stepPending
              }
            >
              ART:{" "}
              {purchase.confirmed_by_artisan ? "Payment Confirmed" : "Pending"}
            </div>
          </div>

          <div className={styles.orderAction}>
            {purchase.status === "completed" ? (
              <span className={styles.completedBanner}>Order Completed</span>
            ) : (
              <>
                {(purchase.customer_id === currentProfile.id || isCustomer) &&
                  !purchase.confirmed_by_customer && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleOrderConfirmation("customer")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" inline />
                          Confirming...
                        </>
                      ) : (
                        "Confirm Item Received"
                      )}
                    </button>
                  )}
                {(purchase.artisan_id === currentProfile.id || isArtisan) &&
                  !purchase.confirmed_by_artisan && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleOrderConfirmation("artisan")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" inline />
                          Confirming...
                        </>
                      ) : (
                        "Confirm Payment Received"
                      )}
                    </button>
                  )}

                {/* Wait Logic */}
                {(((purchase.customer_id === currentProfile.id || isCustomer) &&
                  purchase.confirmed_by_customer &&
                  !purchase.confirmed_by_artisan) ||
                  ((purchase.artisan_id === currentProfile.id || isArtisan) &&
                    purchase.confirmed_by_artisan &&
                    !purchase.confirmed_by_customer)) && (
                  <span className={styles.waitingText}>
                    Waiting for other party confirmation...
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className={styles.messageList}>
        {messages.length === 0 ? (
          <p className={styles.noMessages}>No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUserId={currentProfile.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {conversation.status === "OPEN" ? (
        <ChatInput onSend={(text) => sendMessage(text)} />
      ) : (
        <ClosedChatBanner />
      )}
    </div>
  );
}

export default ChatWindow;
