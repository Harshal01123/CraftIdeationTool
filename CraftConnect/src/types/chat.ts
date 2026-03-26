export type Role = "customer" | "artisan" | "system";

export type ConversationStatus = "OPEN" | "CLOSED";

export type MessageType = "TEXT" | "SYSTEM";

export interface Profile {
  id: string;
  name: string;
  role: "customer" | "artisan" | "learner";
  created_at: string;
  industry: string | null;
  location: string | null;
  description: string | null;
  avatar_url: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  artisan_id: string;
  customer_id: string;
  status: ConversationStatus;
  closed_by_id: string | null;
  created_at: string;
  updated_at: string;
  // These are populated by Supabase join queries
  artisan?: Profile;
  customer?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null; // null for SYSTEM messages
  sender_role: Role;
  type: MessageType;
  content: string;
  created_at: string;
  // Populated by Supabase join query
  sender?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "new_message" | "new_conversation" | "conversation_closed";
  title: string;
  body: string | null;
  conversation_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  artisan_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  // Populated by join query
  artisan?: Profile;
}

export interface Purchase {
  id: string;
  customer_id: string;
  product_id: string | null;
  artisan_id: string | null;
  conversation_id: string | null;
  quantity: number;
  total_price: number;
  status: string;
  confirmed_by_customer: boolean;
  confirmed_by_artisan: boolean;
  created_at: string;
  // Populated by join query
  product?: Product;
  customer?: Profile;
}
