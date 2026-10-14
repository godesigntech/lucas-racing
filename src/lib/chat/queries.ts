import type { SupabaseClient } from "@supabase/supabase-js"

import type { ConversationRow, Database, MessageRow } from "@/lib/supabase/database.types"
import type { ChatMessage, ChatRole, Conversation, ConversationStatus } from "@/types/chat"

// Shared by Server Components and the browser (live updates), so no server-only imports here.

type Client = SupabaseClient<Database>
type ConversationWithCustomer = ConversationRow & { profiles: { full_name: string; email: string } | null }

/** How many recent messages a thread loads. */
export const MESSAGE_LIMIT = 200

const CONVERSATION_SELECT = "*, profiles(full_name, email)"

export function toChatMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderRole: row.sender_role as ChatRole,
    body: row.body,
    attachmentPath: row.attachment_path,
    createdAt: row.created_at,
  }
}

export function toConversation(row: ConversationWithCustomer): Conversation {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.profiles?.full_name ?? "",
    customerEmail: row.profiles?.email ?? "",
    status: row.status as ConversationStatus,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    lastMessageRole: row.last_message_role as ChatRole | null,
    customerUnreadCount: row.customer_unread_count,
    adminUnreadCount: row.admin_unread_count,
  }
}

/** Every conversation that has at least one message, newest first. RLS limits this to admins. */
export async function fetchConversations(supabase: Client): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .not("last_message_at", "is", null)
    .order("last_message_at", { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data as ConversationWithCustomer[]).map(toConversation)
}

export async function fetchConversation(supabase: Client, id: string): Promise<Conversation | null> {
  const { data, error } = await supabase.from("conversations").select(CONVERSATION_SELECT).eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toConversation(data as ConversationWithCustomer) : null
}

/** The signed-in customer's own conversation, if they have started one. */
export async function fetchCustomerConversation(supabase: Client, customerId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("customer_id", customerId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toConversation(data as ConversationWithCustomer) : null
}

/** The most recent messages in a thread, oldest first. */
export async function fetchMessages(supabase: Client, conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_LIMIT)
  if (error) throw new Error(error.message)
  return (data ?? []).reverse().map(toChatMessage)
}
