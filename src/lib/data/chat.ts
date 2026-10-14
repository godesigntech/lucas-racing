import "server-only"

import { notFound } from "next/navigation"

import { requireAdmin } from "@/lib/auth/session"
import { fetchConversation, fetchConversations, fetchMessages } from "@/lib/chat/queries"
import { isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import type { ChatMessage, Conversation } from "@/types/chat"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function listAdminConversations(): Promise<Conversation[]> {
  await requireAdmin()
  if (isDemoMode()) return []
  return fetchConversations(await createClient())
}

export async function getAdminConversation(id: string): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
  await requireAdmin()
  if (isDemoMode() || !UUID.test(id)) notFound()
  const supabase = await createClient()
  const [conversation, messages] = await Promise.all([fetchConversation(supabase, id), fetchMessages(supabase, id)])
  if (!conversation) notFound()
  return { conversation, messages }
}

