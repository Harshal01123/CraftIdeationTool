export type Role = "customer" | "artisan" | "system";

export type ConversationStatus = "OPEN" | "CLOSED";

export type MessageType = "TEXT" | "SYSTEM";

export interface Profile {
  id: string;
  name: string;
  role: "customer" | "artisan" | "learner";
  created_at: string;
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
