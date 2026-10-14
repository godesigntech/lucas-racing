"use client"

import { Fragment, useLayoutEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

import { chatDayKey, formatChatDay } from "@/lib/chat/format"
import type { ThreadMessage } from "@/lib/chat/use-chat-thread"
import { cn } from "@/lib/utils"
import type { ChatRole } from "@/types/chat"

import { MessageBubble } from "./message-bubble"

interface MessageListProps {
  messages: ThreadMessage[]
  viewerRole: ChatRole
  /** How the other side is announced to screen readers, e.g. "The workshop". */
  otherLabel: string
  loading?: boolean
  onRetry?: (id: string) => void
  /** Shown when there are no messages yet. */
  empty?: React.ReactNode
  className?: string
}

/** How close to the bottom (px) still counts as "reading the latest messages". */
const STICK_THRESHOLD = 120

/** Scrollable thread grouped by day. Follows new messages unless the reader has scrolled up. */
export function MessageList({ messages, viewerRole, otherLabel, loading, onRetry, empty, className }: MessageListProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const lastMessage = messages.at(-1)

  useLayoutEffect(() => {
    const element = scroller.current
    if (!element) return
    if (stickToBottom.current || lastMessage?.senderRole === viewerRole) {
      element.scrollTop = element.scrollHeight
    }
  }, [lastMessage?.id, lastMessage?.senderRole, viewerRole, loading])

  return (
    <div
      ref={scroller}
      onScroll={(event) => {
        const element = event.currentTarget
        stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < STICK_THRESHOLD
      }}
      // Photos grow the thread once they load; keep following if the reader was at the bottom.
      onLoadCapture={(event) => {
        if (stickToBottom.current) event.currentTarget.scrollTop = event.currentTarget.scrollHeight
      }}
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5", className)}
    >
      {loading ? (
        <div className="grid h-full place-items-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-label="Loading messages" />
        </div>
      ) : messages.length === 0 ? (
        empty
      ) : (
        <ol className="flex min-h-full flex-col justify-end gap-3" aria-live="polite" aria-relevant="additions">
          {messages.map((message, index) => {
            const day = chatDayKey(message.createdAt)
            const newDay = index === 0 || chatDayKey(messages[index - 1].createdAt) !== day
            return (
              <Fragment key={message.id}>
                {newDay && (
                  <li className="flex justify-center py-2" aria-hidden>
                    <span className="rounded-full bg-carbon/[0.06] px-3 py-1 text-[0.7rem] font-medium text-muted-foreground">
                      {formatChatDay(message.createdAt)}
                    </span>
                  </li>
                )}
                <MessageBubble
                  message={message}
                  own={message.senderRole === viewerRole}
                  senderLabel={otherLabel}
                  onRetry={onRetry}
                />
              </Fragment>
            )
          })}
        </ol>
      )}
    </div>
  )
}
