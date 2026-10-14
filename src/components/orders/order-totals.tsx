import { formatMoney } from "@/lib/format"
import type { Order } from "@/types/order"

export function OrderTotals({ order }: { order: Pick<Order, "subtotal" | "deliveryLabel" | "deliveryPrice" | "total"> }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-muted-foreground">Delivery · {order.deliveryLabel}</dt>
        <dd className="tabular-nums">{order.deliveryPrice ? formatMoney(order.deliveryPrice) : "Free"}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-carbon/10 pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="font-display text-3xl font-bold tabular-nums">{formatMoney(order.total)}</dd>
      </div>
    </dl>
  )
}
