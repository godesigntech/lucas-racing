"use server"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { getCurrentUser } from "@/lib/auth/session"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import { chatMessageSchema, type ChatMessageValues } from "@/lib/validations/chat"
import type { ActionResult } from "@/types/account"

/** A unique violation on the message id means a retried send already landed. */
const DUPLICATE = "23505"

/** Sends a message from the signed-in customer, starting their conversation on the first one. */
export async function sendCustomerMessage(values: ChatMessageValues): Promise<ActionResult<{ conversationId: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in to message the workshop.")

  const parsed = chatMessageSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const { id, body, attachmentPath } = parsed.data
  if (attachmentPath && !attachmentPath.startsWith(`${user.id}/`)) return failure("That attachment isn't valid.")

  const supabase = await createClient()
  const { error: startError } = await supabase
    .from("conversations")
    .upsert({ customer_id: user.id }, { onConflict: "customer_id", ignoreDuplicates: true })
  if (startError) return databaseError(startError, "We couldn't send your message. Please try again.")

  const { data: conversation, error: readError } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", user.id)
    .single()
  if (readError) return databaseError(readError, "We couldn't send your message. Please try again.")

  const { error } = await supabase.from("messages").insert({
    id,
    conversation_id: conversation.id,
    sender_id: user.id,
    sender_role: "customer",
    body,
    attachment_path: attachmentPath,
  })
  if (error && error.code !== DUPLICATE) return databaseError(error, "We couldn't send your message. Please try again.")

  return { ok: true, data: { conversationId: conversation.id } }
}
