import { supabase } from "./supabase";

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
