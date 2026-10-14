import { toneClasses } from "@/lib/orders/status"
import { quoteStatusMeta } from "@/lib/quotes/status"
import { cn } from "@/lib/utils"
import type { QuoteStatus } from "@/types/design-assistant"

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  const meta = quoteStatusMeta[status]
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset",
        toneClasses[meta.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  )
}
