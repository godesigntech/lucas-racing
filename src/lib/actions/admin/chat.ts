"use server"

import { after } from "next/server"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyWorkshopReply } from "@/lib/email/notifications"
import { createClient } from "@/lib/supabase/server"
import { chatMessageSchema, conversationStatusSchema, type ChatMessageValues } from "@/lib/validations/chat"
import type { ActionResult } from "@/types/account"
import type { ConversationStatus } from "@/types/chat"

import { getAdmin, NOT_ALLOWED } from "./guard"

const DUPLICATE = "23505"

export async function sendAdminMessage(
  conversationId: string,
  values: ChatMessageValues,
): Promise<ActionResult<{ conversationId: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const admin = await getAdmin()
  if (!admin) return NOT_ALLOWED

  const parsed = chatMessageSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const { id, body, attachmentPath } = parsed.data

  const supabase = await createClient()
  const { data: conversation, error: readError } = await supabase
    .from("conversations")
    .select("id, customer_id, customer_unread_count, profiles(full_name, email)")
    .eq("id", conversationId)
    .maybeSingle()
  if (readError) return databaseError(readError, "We couldn't send the reply.")
  if (!conversation) return failure("That conversation no longer exists.")
  // Photos are stored in the customer's folder so both sides can open them.
  if (attachmentPath && !attachmentPath.startsWith(`${conversation.customer_id}/`)) {
    return failure("That attachment isn't valid.")
  }

  const { error } = await supabase.from("messages").insert({
    id,
    conversation_id: conversation.id,
    sender_id: admin.id,
    sender_role: "admin",
    body,
    attachment_path: attachmentPath,
  })
  if (error && error.code !== DUPLICATE) return databaseError(error, "We couldn't send the reply.")

  // Let the customer know by email, once per run of unread replies.
  const customer = conversation.profiles as { full_name: string; email: string } | null
  if (!error && conversation.customer_unread_count === 0 && customer) {
    after(() => notifyWorkshopReply({ customerEmail: customer.email, customerName: customer.full_name, body }))
  }
  return { ok: true, data: { conversationId: conversation.id } }
}

export async function setConversationStatus(conversationId: string, status: ConversationStatus): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED

  const parsed = conversationStatusSchema.safeParse(status)
  if (!parsed.success) return failure("Unknown status.")

  const supabase = await createClient()
  const { error } = await supabase.from("conversations").update({ status: parsed.data }).eq("id", conversationId)
  if (error) return databaseError(error, "We couldn't update the conversation.")

  return { ok: true, message: parsed.data === "resolved" ? "Marked as resolved." : "Conversation reopened." }
}

/** Opens (or creates) the conversation with a customer, for the "Message" button on their profile. */
export async function startConversation(customerId: string): Promise<ActionResult<{ conversationId: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { error: startError } = await supabase
    .from("conversations")
    .upsert({ customer_id: customerId }, { onConflict: "customer_id", ignoreDuplicates: true })
  if (startError) return databaseError(startError, "We couldn't open a conversation with this customer.")

  const { data, error } = await supabase.from("conversations").select("id").eq("customer_id", customerId).single()
  if (error) return databaseError(error, "We couldn't open a conversation with this customer.")

  return { ok: true, data: { conversationId: data.id } }
}
