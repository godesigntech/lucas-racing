import { AlertCircle, Check, Clock } from "lucide-react"

import { formatChatTime } from "@/lib/chat/format"
import type { ThreadMessage } from "@/lib/chat/use-chat-thread"
import { cn } from "@/lib/utils"

import { ChatImage } from "./chat-image"

interface MessageBubbleProps {
  message: ThreadMessage
  /** True when the viewer sent this message (shown on the right). */
  own: boolean
  /** Who the other side is, for screen readers. */
  senderLabel: string
  onRetry?: (id: string) => void
}

export function MessageBubble({ message, own, senderLabel, onRetry }: MessageBubbleProps) {
  const time = formatChatTime(message.createdAt)
  const hasPhoto = Boolean(message.attachmentPath || message.localPreviewUrl)

  return (
    <li className={cn("flex flex-col gap-1", own ? "items-end" : "items-start")}>
      <span className="sr-only">{own ? "You" : senderLabel} said:</span>
      <div
        className={cn(
          "max-w-[85%] space-y-2 rounded-3xl text-sm leading-relaxed",
          own ? "rounded-br-lg bg-carbon text-paper" : "rounded-bl-lg bg-carbon/[0.06] text-carbon",
          hasPhoto ? "p-1.5" : "px-4 py-2.5",
          message.pending && "opacity-70",
        )}
      >
        {hasPhoto && <ChatImage path={message.attachmentPath} previewUrl={message.localPreviewUrl} />}
        {message.body && (
          <p className={cn("whitespace-pre-wrap break-words", hasPhoto && "px-2.5 pb-1.5")}>{message.body}</p>
        )}
      </div>
      {message.failed ? (
        <button
          type="button"
          onClick={() => onRetry?.(message.id)}
          className="flex items-center gap-1 text-xs font-medium text-destructive underline-offset-4 hover:underline"
        >
          <AlertCircle className="size-3.5" aria-hidden /> Not sent. Tap to retry
        </button>
      ) : (
        <span className="flex items-center gap-1 px-1 text-[0.7rem] text-muted-foreground">
          <time dateTime={message.createdAt}>{time}</time>
          {own &&
            (message.pending ? (
              <Clock className="size-3" aria-label="Sending" />
            ) : (
              <Check className="size-3" aria-label="Sent" />
            ))}
        </span>
      )}
    </li>
  )
}
