import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

/** A message from the assistant, with its avatar. */
export function AssistantBubble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-end gap-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-carbon text-lime" aria-hidden>
        <Sparkles className="size-3.5" />
      </span>
      <div className={cn("min-w-0 max-w-[88%] rounded-3xl rounded-bl-lg bg-carbon/[0.06] px-4 py-3 text-sm leading-relaxed", className)}>
        {children}
      </div>
    </div>
  )
}

/** Animated "thinking" dots. */
export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-carbon/50"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}
