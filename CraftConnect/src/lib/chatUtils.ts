import { supabase } from "./supabase";
import type { OfferPayload, OfferStatus } from "../types/chat";

export async function startConversation({
  customerId,
  artisanId,
  title,
  productId,
  productPrice,
  messageText,
  isOrder,
}: {
  customerId: string;
  artisanId: string;
  title: string;
  productId?: string;
  productPrice?: number;
  messageText?: string;
  isOrder?: boolean;
}) {
  // 1. Create a Conversation
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({
      artisan_id: artisanId,
      customer_id: customerId,
      title,
      status: "OPEN",
    })
    .select("id")
    .single();

  if (convError || !conv) {
    console.error("Failed to start chat:", convError);
    return { error: "Failed to start chat" };
  }

  // 2. If it's an order, create a Purchase record
  if (isOrder && productId && productPrice !== undefined) {
    const { error: purchaseError } = await supabase.from("purchases").insert({
      customer_id: customerId,
      product_id: productId,
      artisan_id: artisanId,
      total_price: productPrice,
      status: "pending",
      conversation_id: conv.id,
      confirmed_by_customer: false,
      confirmed_by_artisan: false,
    });

    if (purchaseError) {
      console.error("Failed to create order record:", purchaseError);
      return { error: "Failed to create order record" };
    }
  }

  // 3. Insert any user-provided initial message
  if (messageText?.trim()) {
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: customerId,
      sender_role: "customer",
      type: "TEXT",
      content: messageText.trim(),
    });
  }

  // 4. Insert system message for orders
  if (isOrder) {
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: null,
      sender_role: "system",
      type: "SYSTEM",
      content: `Order request started. Waiting for mutual confirmation.`,
    });
  } else {
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: null,
      sender_role: "system",
      type: "SYSTEM",
      content: `Chat started.`,
    });
  }

  return { conversationId: conv.id };
}

/**
 * Start a chat with the first offer already embedded.
 * Returns { conversationId, messageId } on success.
 */
export async function startProductConversation({
  customerId,
  artisanId,
  title,
  payload,
}: {
  customerId: string;
  artisanId: string;
  title?: string;
  payload: Omit<OfferPayload, "offerId" | "status">;
}): Promise<{ conversationId?: string; error?: string }> {
  const finalTitle = title || `Offer for ${payload.productName}`;

  // 1. Create conversation
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({ artisan_id: artisanId, customer_id: customerId, title: finalTitle, status: "OPEN" })
    .select("id")
    .single();

  if (convError || !conv) {
    console.error("startProductConversation:", convError);
    return { error: "Failed to create conversation." };
  }

  // 2. Insert system message
  await supabase.from("messages").insert({
    conversation_id: conv.id,
    sender_id: null,
    sender_role: "system",
    type: "SYSTEM",
    content: "Chat started. Customer has made a product offer.",
  });

  // 3. Insert the OFFER message — offerId will be the message's own id
  const offerPayload: OfferPayload = {
    offerId: "",          // placeholder; updated below after insert
    status: "pending",
    ...payload,
  };

  const { data: msgData, error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conv.id,
      sender_id: customerId,
      sender_role: "customer",
      type: "OFFER",
      content: JSON.stringify({ ...offerPayload, offerId: "PENDING" }),
    })
    .select("id")
    .single();

  if (msgError || !msgData) {
    console.error("sendOffer:", msgError);
    return { error: "Failed to send offer message." };
  }

  // 4. Self-patch offerId = message.id
  const finalPayload: OfferPayload = { ...offerPayload, offerId: msgData.id };
  await supabase
    .from("messages")
    .update({ content: JSON.stringify(finalPayload) })
    .eq("id", msgData.id);

  return { conversationId: conv.id };
}

/**
 * Send a counter-offer on an existing conversation.
 */
export async function sendOffer({
  conversationId,
  senderId,
  senderRole,
  payload,
}: {
  conversationId: string;
  senderId: string;
  senderRole: "customer" | "artisan";
  payload: Omit<OfferPayload, "offerId" | "status">;
}): Promise<{ messageId?: string; error?: string }> {
  const offerPayload: OfferPayload = { offerId: "PENDING", status: "pending", ...payload };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_role: senderRole,
      type: "OFFER",
      content: JSON.stringify(offerPayload),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("sendOffer:", error);
    return { error: "Failed to send offer." };
  }

  // Self-patch offerId
  const final: OfferPayload = { ...offerPayload, offerId: data.id };
  await supabase.from("messages").update({ content: JSON.stringify(final) }).eq("id", data.id);

  // Bump conversation updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { messageId: data.id };
}

/**
 * Update the status of an existing OFFER message, optionally changing the price.
 */
export async function updateOfferStatus(
  messageId: string,
  status: OfferStatus,
  newPrice?: number
): Promise<{ error?: string }> {
  // Fetch current content
  const { data, error: fetchError } = await supabase
    .from("messages")
    .select("content")
    .eq("id", messageId)
    .single();

  if (fetchError || !data) return { error: "Offer not found." };

  try {
    const current: OfferPayload = JSON.parse(data.content);
    const updated: OfferPayload = {
      ...current,
      status,
      offeredPrice: newPrice !== undefined ? newPrice : current.offeredPrice,
    };
    const { error } = await supabase
      .from("messages")
      .update({ content: JSON.stringify(updated) })
      .eq("id", messageId);
    if (error) return { error: error.message };
  } catch {
    return { error: "Failed to parse offer payload." };
  }

  return {};
}
