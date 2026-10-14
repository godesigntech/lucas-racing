"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, RotateCcw, UserRound } from "lucide-react"
import { toast } from "react-toastify"

import { ChatComposer } from "@/components/chat/chat-composer"
import { MessageList } from "@/components/chat/message-list"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { sendAdminMessage, setConversationStatus } from "@/lib/actions/admin/chat"
import { markConversationRead, useChatThread } from "@/lib/chat/use-chat-thread"
import { useRealtimeRows } from "@/lib/chat/use-realtime-rows"
import type { ChatMessageValues } from "@/lib/validations/chat"
import type { ChatMessage, Conversation, ConversationStatus } from "@/types/chat"

interface AdminChatThreadProps {
  conversation: Conversation
  initialMessages: ChatMessage[]
}

/** One customer conversation in the admin inbox. Remount per conversation (key by id). */
export function AdminChatThread({ conversation, initialMessages }: AdminChatThreadProps) {
  const { id, customerId } = conversation
  const name = conversation.customerName || conversation.customerEmail
  const firstName = conversation.customerName.trim().split(/\s+/)[0] || "the customer"

  const [status, setStatus] = useState<ConversationStatus>(conversation.status)
  const [unread, setUnread] = useState(conversation.adminUnreadCount)
  const [isUpdating, startUpdate] = useTransition()

  const send = useCallback((values: ChatMessageValues) => sendAdminMessage(id, values), [id])
  const thread = useChatThread({ conversationId: id, initialMessages, viewerRole: "admin", customerId, send })

  // Track this conversation's row so new customer messages are marked read while it's open,
  // and a reply from the customer reopens a resolved conversation here too.
  useRealtimeRows({
    table: "conversations",
    event: "UPDATE",
    filter: `id=eq.${id}`,
    onChange: (payload) => {
      if (payload.eventType !== "UPDATE") return
      setUnread(payload.new.admin_unread_count)
      setStatus(payload.new.status as ConversationStatus)
    },
  })

  useEffect(() => {
    if (unread === 0) return
    const markIfVisible = () => {
      if (document.visibilityState === "visible") void markConversationRead(id, "admin")
    }
    markIfVisible()
    document.addEventListener("visibilitychange", markIfVisible)
    return () => document.removeEventListener("visibilitychange", markIfVisible)
  }, [id, unread])

  function changeStatus(next: ConversationStatus) {
    startUpdate(async () => {
      const result = await setConversationStatus(id, next)
      if (result.ok) {
        setStatus(next)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="flex min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-carbon/10 px-3 py-3 sm:px-4">
        <Button asChild variant="ghost" size="icon-sm" className="lg:hidden">
          <Link href="/admin/messages" aria-label="Back to all messages">
            <ArrowLeft />
          </Link>
        </Button>
        <UserAvatar name={name} size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold leading-tight">{name}</h2>
          <p className="truncate text-xs text-muted-foreground">{conversation.customerEmail}</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href={`/admin/customers/${customerId}`}>
            <UserRound /> Profile
          </Link>
        </Button>
        {status === "open" ? (
          <Button variant="secondary" size="sm" onClick={() => changeStatus("resolved")} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCircle2 aria-hidden />}
            <span className="max-sm:sr-only">Resolve</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => changeStatus("open")} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
            <span className="max-sm:sr-only">Reopen</span>
          </Button>
        )}
      </header>

      <MessageList
        messages={thread.messages}
        viewerRole="admin"
        otherLabel={name}
        onRetry={thread.retry}
        className="bg-paper/60"
        empty={
          <div className="grid h-full place-items-center px-6 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to {firstName}.
          </div>
        }
      />

      <ChatComposer onSend={thread.sendMessage} placeholder={`Reply to ${firstName}…`} />
    </div>
  )
}
