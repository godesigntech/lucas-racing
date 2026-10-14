"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import { MessagesSquare, Search } from "lucide-react"

import { UserAvatar } from "@/components/shared/user-avatar"
import { formatInboxTime } from "@/lib/chat/format"
import { fetchConversations } from "@/lib/chat/queries"
import { useRealtimeRows } from "@/lib/chat/use-realtime-rows"
import { createClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"
import type { Conversation, ConversationStatus } from "@/types/chat"

const tabs: { value: ConversationStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
]

/** Inbox column: every customer conversation, kept live, with an Open/Resolved split and search. */
export function ConversationList({ initialConversations }: { initialConversations: Conversation[] }) {
  const activeId = useSelectedLayoutSegment()
  const [conversations, setConversations] = useState(initialConversations)
  const [status, setStatus] = useState<ConversationStatus>("open")
  const [query, setQuery] = useState("")

  // Change payloads don't include the customer's name, so reload the (short) list instead.
  const refresh = useCallback(async () => {
    try {
      setConversations(await fetchConversations(createClient()))
    } catch {
      // Keep showing the last good list; the next change or tab focus retries.
    }
  }, [])
  useRealtimeRows({ table: "conversations", onChange: refresh, onResync: refresh })

  const counts = useMemo(() => {
    const result: Record<ConversationStatus, number> = { open: 0, resolved: 0 }
    for (const conversation of conversations) result[conversation.status] += 1
    return result
  }, [conversations])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return conversations.filter(
      (conversation) =>
        conversation.status === status &&
        (!term ||
          conversation.customerName.toLowerCase().includes(term) ||
          conversation.customerEmail.toLowerCase().includes(term)),
    )
  }, [conversations, status, query])

  return (
    <div className={cn("flex min-h-0 flex-col border-carbon/10 lg:border-r", activeId && "max-lg:hidden")}>
      <div className="space-y-3 border-b border-carbon/10 p-4">
        <h1 className="font-display text-3xl font-bold uppercase leading-none">Messages</h1>
        <div className="flex gap-1 rounded-full bg-carbon/[0.05] p-1" role="tablist" aria-label="Filter conversations">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                status === tab.value ? "bg-card text-carbon shadow-sm" : "text-muted-foreground hover:text-carbon",
              )}
            >
              {tab.label} <span className="text-muted-foreground">({counts[tab.value]})</span>
            </button>
          ))}
        </div>
        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            className="h-10 w-full rounded-full border border-input bg-paper pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center text-sm text-muted-foreground">
          <MessagesSquare className="size-8 text-carbon/25" aria-hidden />
          {query
            ? "No conversations match that search."
            : status === "open"
              ? "No open conversations. New customer messages will appear here."
              : "No resolved conversations yet."}
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-carbon/[0.06] overflow-y-auto">
          {visible.map((conversation) => (
            <li key={conversation.id}>
              <ConversationRow conversation={conversation} active={conversation.id === activeId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ConversationRow({ conversation, active }: { conversation: Conversation; active: boolean }) {
  const name = conversation.customerName || conversation.customerEmail
  const unread = conversation.adminUnreadCount
  const preview = `${conversation.lastMessageRole === "admin" ? "You: " : ""}${conversation.lastMessagePreview}`

  return (
    <Link
      href={`/admin/messages/${conversation.id}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 transition-colors",
        active ? "bg-lime/25" : "hover:bg-carbon/[0.03]",
      )}
    >
      <UserAvatar name={name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("truncate text-sm", unread ? "font-bold" : "font-semibold")}>{name}</p>
          {conversation.lastMessageAt && (
            <time dateTime={conversation.lastMessageAt} className="shrink-0 text-xs text-muted-foreground">
              {formatInboxTime(conversation.lastMessageAt)}
            </time>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p className={cn("min-w-0 flex-1 truncate text-sm", unread ? "font-medium text-carbon" : "text-muted-foreground")}>
            {preview}
          </p>
          {unread > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-carbon px-1.5 text-[0.7rem] font-bold leading-5 text-lime">
              {unread > 9 ? "9+" : unread}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
