import { stockLabels } from "@/lib/shop/stock"
import { cn } from "@/lib/utils"
import type { StockStatus } from "@/types/shop"

const tones: Record<StockStatus, string> = {
  in_stock: "bg-emerald-100 text-emerald-900 ring-emerald-300/60",
  low_stock: "bg-amber-100 text-amber-900 ring-amber-300/60",
  out_of_stock: "bg-destructive/10 text-destructive ring-destructive/25",
  backorder: "bg-sky-100 text-sky-900 ring-sky-300/60",
  untracked: "bg-emerald-100 text-emerald-900 ring-emerald-300/60",
}

/** "In stock", "Low stock", "Out of stock"… as a small pill. */
export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset",
        tones[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {stockLabels[status]}
    </span>
  )
}
