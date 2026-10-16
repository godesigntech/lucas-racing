import { Check, X } from "lucide-react"

import { orderProgressSteps, orderStatusMeta, progressIndex } from "@/lib/orders/status"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types/order"

/** Step tracker showing where an order is on the way to the customer. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        <X className="size-4" aria-hidden /> {orderStatusMeta.cancelled.description}
      </p>
    )
  }

  const current = progressIndex(status)
  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Order progress">
      {orderProgressSteps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={step} className="flex flex-col gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "h-1.5 rounded-full",
                done || active ? "bg-brand-ink" : "bg-carbon/10",
                active && "bg-brand ring-2 ring-brand-ink/30",
              )}
            />
            <span className={cn("flex items-center gap-1 text-[0.7rem] font-medium sm:text-xs", done || active ? "text-carbon" : "text-muted-foreground")}>
              {done && <Check className="size-3 shrink-0 text-brand-ink" aria-hidden />}
              <span className="truncate">{orderStatusMeta[step].label}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
