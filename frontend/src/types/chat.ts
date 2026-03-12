export type Role = "customer" | "artisan" | "system";

export type ConversationStatus = "OPEN" | "CLOSED";

export type MessageType = "TEXT" | "SYSTEM";

export interface Profile {
  id: string;
  name: string;
  role: "Customer" | "Artisan" | "Learner";
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
