import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { sendOffer, updateOfferStatus } from "../../lib/chatUtils";
import type { Profile, OfferPayload, Product } from "../../types/chat";
import { useChat } from "../../hooks/useChat";
import { useMode } from "../../contexts/ModeContext";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import ClosedChatBanner from "./ClosedChatBanner";
import PriceSetDialog from "./PriceSetDialog";
import ArtisanProductPicker from "./ArtisanProductPicker";
import Button from "../Button";
import Spinner from "../Spinner";
import styles from "./ChatWindow.module.css";
import { useTranslation } from "react-i18next";

interface Props {
  conversationId: string;
  currentProfile: Profile;
}

function ChatWindow({ conversationId, currentProfile }: Props) {
  const { messages, conversation, loading, sendMessage, closeConversation, markAsRead } =
    useChat(conversationId, currentProfile);

  const [showConfirm, setShowConfirm] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [bargainTarget, setBargainTarget] = useState<OfferPayload | null>(null);
  const [showNewOfferPicker, setShowNewOfferPicker] = useState(false);
  // Track which offer message IDs have already been acted on (prevents double-click)
  const [actedOfferIds, setActedOfferIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const { activeMode } = useMode();

  const { t } = useTranslation();
  const isArtisan = activeMode === "artisan";

  function markActed(id: string) {
    setActedOfferIds((prev) => new Set([...prev, id]));
  }

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  // Mark all existing messages as read when we open the window
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages.length, markAsRead]);

  // Find the latest OFFER message that is "pending"
  const latestPendingOffer = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.type !== "OFFER") continue;
      try {
        const p = JSON.parse(m.content) as OfferPayload;
        if (p.status === "pending") return { message: m, payload: p };
      } catch { /* skip */ }
    }
    return null;
  }, [messages]);

  // Last offer payload regardless of status (for "New Offer" re-use)
  const lastOfferPayload = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.type !== "OFFER") continue;
      try { return JSON.parse(m.content) as OfferPayload; } catch { /* skip */ }
    }
    return null;
  }, [messages]);

  // Synthetic Product built from last offer for PriceSetDialog
  const lastOfferProduct: Product | null = (lastOfferPayload && conversation)
    ? {
        id: lastOfferPayload.productId,
        artisan_id: conversation.artisan_id,
        name: lastOfferPayload.productName,
        description: null,
        price: lastOfferPayload.listedPrice,
        category: null,
        image_url: lastOfferPayload.imageUrl,
        is_available: true,
        created_at: "",
      }
    : null;

  async function handleClose() {
    await closeConversation();
    setShowConfirm(false);
  }

  // ── Accept offer ──
  async function handleAccept(messageId: string, payload: OfferPayload) {
    markActed(messageId); // prevent re-click immediately
    setIsActing(true);
    await updateOfferStatus(messageId, "accepted");

    // Create purchase record
    const { error: purchaseError } = await supabase.from("purchases").insert({
      customer_id: conversation!.customer_id,
      artisan_id: conversation!.artisan_id,
      product_id: payload.productId,
      total_price: payload.offeredPrice,
      status: "pending",
      conversation_id: conversationId,
      confirmed_by_customer: false,
      confirmed_by_artisan: false,
    });

    if (purchaseError) {
      console.error("Purchase insert error:", purchaseError);
      alert(`Could not create order: ${purchaseError.message}`);
      setIsActing(false);
      return;
    }

    await sendMessage(
      `✅ Offer accepted! ₹${payload.offeredPrice.toLocaleString()} agreed for “${payload.productName}”. Order has been placed.`,
      "SYSTEM"
    );
    setIsActing(false);
  }

  // ── Reject offer — sends role-aware messages, keeps chat open ──
  async function handleReject(messageId: string, payload: OfferPayload) {
    markActed(messageId); // prevent re-click immediately
    setIsActing(true);
    await updateOfferStatus(messageId, "rejected");

    const rejectorLabel = isArtisan ? "Artisan" : "Customer";
    const otherLabel    = isArtisan ? "customer" : "artisan";

    // Message seen by BOTH (stored once, rendered for all)
    // Encode rejector role in the content so each side can contextualise it
    await sendMessage(
      `REJECTED_BY:${currentProfile.id}|${rejectorLabel} declined the offer for “${payload.productName}” (₹${payload.offeredPrice.toLocaleString()}).${
        !isArtisan ? " You can make a new offer below." : " The " + otherLabel + " may make a new offer."
      }`,
      "SYSTEM"
    );
    setIsActing(false);
  }

  // ── Send counter-offer ──
  async function handleBargain(originalPayload: OfferPayload, newPrice: number, messageId: string) {
    markActed(messageId); // prevent re-click immediately
    setIsActing(true);
    await updateOfferStatus(messageId, "countered");

    await sendOffer({
      conversationId,
      senderId: currentProfile.id,
      senderRole: isArtisan ? "artisan" : "customer",
      payload: {
        productId: originalPayload.productId,
        productName: originalPayload.productName,
        imageUrl: originalPayload.imageUrl,
        listedPrice: originalPayload.listedPrice,
        offeredPrice: newPrice,
      },
    });

    setBargainTarget(null);
    setIsActing(false);
  }

  if (loading) {
    return <div className={styles.status}><Spinner label={t("extended.loadingMessages")} /></div>;
  }

  if (!conversation) {
    return <div className={styles.status}>{t("extended.couldNotLoad")}</div>;
  }

  const other = isArtisan ? conversation.customer : conversation.artisan;

  // Build a synthetic Product object from the bargainTarget payload for PriceSetDialog
  const bargainProduct: Product | null = bargainTarget
    ? {
        id: bargainTarget.productId,
        artisan_id: conversation.artisan_id,
        name: bargainTarget.productName,
        description: null,
        price: bargainTarget.listedPrice,
        category: null,
        image_url: bargainTarget.imageUrl,
        is_available: true,
        created_at: "",
      }
    : null;

  return (
    <>
      <div className={styles.window}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className={styles.title}>{other?.name || "Chat"}</span>
            {conversation.title && (
              <span className={styles.subtitle}>{conversation.title}</span>
            )}
          </div>

          {conversation.status === "OPEN" ? (
            !showConfirm ? (
              <Button variant="secondary" onClick={() => setShowConfirm(true)}>{t("extended.endChat")}</Button>
            ) : (
              <div className={styles.confirmRow}>
                <span className={styles.confirmText}>{t("extended.areYouSure")}</span>
                <Button variant="secondary" onClick={handleClose}>{t("extended.yes")}</Button>
                <Button variant="secondary" onClick={() => setShowConfirm(false)}>{t("extended.no")}</Button>
              </div>
            )
          ) : (
            <span className={styles.closedBadge}>{t("extended.archivedBadge")}</span>
          )}
        </div>

        {/* Messages */}
        <div className={styles.messageList} ref={listRef}>
          {messages.length === 0 ? (
            <p className={styles.noMessages}>{t("extended.noMessages")}</p>
          ) : (
            messages.map((msg) => {
              const payload = msg.type === "OFFER"
                ? (() => { try { return JSON.parse(msg.content) as OfferPayload; } catch { return null; } })()
                : null;
              
              const isThisLatestPending =
                latestPendingOffer?.message.id === msg.id &&
                !actedOfferIds.has(msg.id) &&
                payload?.status === "pending";

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={currentProfile.id}
                  isArtisan={isArtisan}
                  isLatestPendingOffer={isThisLatestPending}
                  onAccept={isThisLatestPending && payload
                    ? () => handleAccept(msg.id, payload)
                    : undefined}
                  onReject={isThisLatestPending && payload
                    ? () => handleReject(msg.id, payload)
                    : undefined}
                  onBargain={isThisLatestPending && payload
                    ? () => setBargainTarget(payload)
                    : undefined}
                  onMakeNewOffer={!isArtisan ? () => setShowNewOfferPicker(true) : undefined}
                  disabled={isActing}
                />
              );
            })
          )}
        </div>

        {conversation.status === "OPEN" ? (
          <ChatInput
            onSend={(text) => sendMessage(text)}
            onReOffer={
              !isArtisan && lastOfferPayload?.status === "rejected"
                ? () => setShowNewOfferPicker(true)
                : undefined
            }
          />
        ) : (
          <ClosedChatBanner />
        )}
      </div>

      {/* Bargain / Counter-offer dialog */}
      {bargainProduct && bargainTarget && (
        <PriceSetDialog
          product={bargainProduct}
          initialPrice={bargainTarget.offeredPrice}
          title={isArtisan ? t("extended.sendCounterOffer") : t("extended.counterTheirOffer")}
          onConfirm={(price) => {
            const msg = latestPendingOffer?.message;
            if (!msg) return;
            handleBargain(bargainTarget, price, msg.id);
          }}
          onClose={() => setBargainTarget(null)}
          isProcessing={isActing}
        />
      )}

      {/* New Offer flow — customer picks product from this artisan again */}
      {showNewOfferPicker && conversation && !isArtisan && (
        lastOfferProduct ? (
          // Re-offer on the same product via PriceSetDialog
          <PriceSetDialog
            product={lastOfferProduct}
            initialPrice={lastOfferPayload?.offeredPrice}
            title={t("extended.makeNewOffer")}
            onConfirm={async (price) => {
              setIsActing(true);
              await sendOffer({
                conversationId,
                senderId: currentProfile.id,
                senderRole: "customer",
                payload: {
                  productId: lastOfferPayload!.productId,
                  productName: lastOfferPayload!.productName,
                  imageUrl: lastOfferPayload!.imageUrl,
                  listedPrice: lastOfferPayload!.listedPrice,
                  offeredPrice: price,
                },
              });
              setShowNewOfferPicker(false);
              setIsActing(false);
            }}
            onClose={() => setShowNewOfferPicker(false)}
            isProcessing={isActing}
          />
        ) : (
          // No previous product — show full product picker
          <div style={{
            position: "fixed", inset: 0,
            background: "rgba(43,32,23,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2000, padding: "1rem",
          }} onClick={() => setShowNewOfferPicker(false)}>
            <div style={{
              background: "var(--surface-container-lowest,#fff)",
              borderRadius: "1rem", padding: "1.5rem",
              width: "100%", maxWidth: "480px",
              boxShadow: "0 24px 60px rgba(43,32,23,0.2)",
            }} onClick={(e) => e.stopPropagation()}>
              <ArtisanProductPicker
                artisan={conversation.artisan!}
                onOfferConfirmed={async (product, price) => {
                  setIsActing(true);
                  await sendOffer({
                    conversationId,
                    senderId: currentProfile.id,
                    senderRole: "customer",
                    payload: {
                      productId: product.id,
                      productName: product.name,
                      imageUrl: product.image_url,
                      listedPrice: product.price,
                      offeredPrice: price,
                    },
                  });
                  setShowNewOfferPicker(false);
                  setIsActing(false);
                }}
                onBack={() => setShowNewOfferPicker(false)}
                isProcessing={isActing}
              />
            </div>
          </div>
        )
      )}
    </>
  );
}

export default ChatWindow;
