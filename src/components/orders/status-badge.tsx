import { orderStatusMeta, paymentStatusMeta, toneClasses } from "@/lib/orders/status"
import { cn } from "@/lib/utils"
import type { OrderStatus, PaymentStatus } from "@/types/order"

const base = "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset"

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = orderStatusMeta[status]
  return (
    <span className={cn(base, toneClasses[meta.tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  )
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const meta = paymentStatusMeta[status]
  return <span className={cn(base, toneClasses[meta.tone], className)}>{meta.label}</span>
}
