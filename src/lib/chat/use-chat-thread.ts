"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "react-toastify"

import { createClient } from "@/lib/supabase/browser"
import type { ChatMessageValues } from "@/lib/validations/chat"
import type { ActionResult } from "@/types/account"
import type { ChatMessage, ChatRole } from "@/types/chat"

import { uploadChatImage } from "./attachments"
import { fetchMessages, toChatMessage } from "./queries"
import { useRealtimeRows } from "./use-realtime-rows"

export type SendChatMessage = (values: ChatMessageValues) => Promise<ActionResult<{ conversationId: string }>>

/** A message as shown in the thread, with a local preview while its photo uploads. */
export type ThreadMessage = ChatMessage & { localPreviewUrl?: string }

interface ChatThreadOptions {
  conversationId: string | null
  initialMessages?: ChatMessage[]
  viewerRole: ChatRole
  /** Owner of the conversation; photos are stored in their folder. */
  customerId: string
  send: SendChatMessage
  /** Only subscribe while the thread is on screen. */
  enabled?: boolean
}

/** Adds or updates messages by id and keeps the thread in time order. */
function mergeMessages(current: ThreadMessage[], incoming: ChatMessage[]): ThreadMessage[] {
  if (incoming.length === 0) return current
  const byId = new Map(current.map((message) => [message.id, message]))
  for (const message of incoming) {
    const existing = byId.get(message.id)
    byId.set(message.id, { ...message, localPreviewUrl: existing?.localPreviewUrl })
  }
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/**
 * State for one chat thread: live incoming messages, optimistic sending with
 * photo upload, and retry for failed sends. Shared by the customer widget and
 * the admin inbox.
 */
export function useChatThread({
  conversationId: initialConversationId,
  initialMessages,
  viewerRole,
  customerId,
  send,
  enabled = true,
}: ChatThreadOptions) {
  const [conversationId, setConversationId] = useState(initialConversationId)
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages ?? [])
  const [loaded, setLoaded] = useState(initialMessages !== undefined || !initialConversationId)
  const files = useRef(new Map<string, File>())

  // The customer widget learns about a conversation the workshop started from props.
  if (initialConversationId && initialConversationId !== conversationId) {
    setConversationId(initialConversationId)
  }

  const resync = useCallback(async () => {
    if (!conversationId) return
    try {
      const fresh = await fetchMessages(createClient(), conversationId)
      setMessages((current) => mergeMessages(current, fresh))
    } catch {
      // Live updates keep trying; a failed refresh isn't worth interrupting the user for.
    } finally {
      setLoaded(true)
    }
  }, [conversationId])

  useRealtimeRows({
    table: "messages",
    event: "INSERT",
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    enabled: enabled && Boolean(conversationId),
    onChange: (payload) => {
      if (payload.eventType === "INSERT") setMessages((current) => mergeMessages(current, [toChatMessage(payload.new)]))
    },
    onResync: resync,
  })

  const update = useCallback((id: string, changes: Partial<ThreadMessage>) => {
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...changes } : message)))
  }, [])

  const deliver = useCallback(
    async (message: ThreadMessage) => {
      update(message.id, { pending: true, failed: false })
      try {
        let attachmentPath = message.attachmentPath
        const file = files.current.get(message.id)
        if (file && !attachmentPath) {
          attachmentPath = await uploadChatImage(customerId, file)
          update(message.id, { attachmentPath })
        }

        const result = await send({ id: message.id, body: message.body, attachmentPath })
        if (!result.ok) throw new Error(result.message)

        files.current.delete(message.id)
        if (result.data) setConversationId(result.data.conversationId)
        update(message.id, { pending: false, conversationId: result.data?.conversationId ?? message.conversationId })
      } catch (error) {
        update(message.id, { pending: false, failed: true })
        toast.error(error instanceof Error && error.message ? error.message : "Your message wasn't sent. Tap it to try again.")
      }
    },
    [customerId, send, update],
  )

  const sendMessage = useCallback(
    (body: string, file: File | null) => {
      const message: ThreadMessage = {
        id: crypto.randomUUID(),
        conversationId: conversationId ?? "",
        senderRole: viewerRole,
        body: body.trim(),
        attachmentPath: null,
        createdAt: new Date().toISOString(),
        pending: true,
        localPreviewUrl: file ? URL.createObjectURL(file) : undefined,
      }
      if (file) files.current.set(message.id, file)
      setMessages((current) => [...current, message])
      void deliver(message)
    },
    [conversationId, viewerRole, deliver],
  )

  const retry = useCallback(
    (id: string) => {
      const message = messages.find((item) => item.id === id)
      if (message?.failed) void deliver(message)
    },
    [messages, deliver],
  )

  return { conversationId, messages, loaded, sendMessage, retry }
}

/** Clears this side's unread counter. Failures are harmless: the badge just stays until next time. */
export async function markConversationRead(conversationId: string, role: ChatRole) {
  await createClient().rpc("mark_conversation_read", { p_conversation_id: conversationId, p_role: role })
}
