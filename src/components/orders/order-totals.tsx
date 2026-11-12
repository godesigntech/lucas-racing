import { formatMoney } from "@/lib/format"
import type { Order } from "@/types/order"

export function OrderTotals({
  order,
}: {
  order: Pick<Order, "subtotal" | "deliveryLabel" | "deliveryPrice" | "total"> & { depositAmount?: number; rushFee?: number; discountAmount?: number; voucherCode?: string | null }
}) {
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
      {Boolean(order.rushFee) && (
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Faster turnaround</dt>
          <dd className="tabular-nums">{formatMoney(order.rushFee ?? 0)}</dd>
        </div>
      )}
      {Boolean(order.discountAmount) && (
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Voucher{order.voucherCode ? ` · ${order.voucherCode}` : ""}</dt>
          <dd className="tabular-nums">−{formatMoney(order.discountAmount ?? 0)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-carbon/10 pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="font-display text-3xl font-bold tabular-nums">{formatMoney(order.total)}</dd>
      </div>
      {Boolean(order.depositAmount) && (
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Deposit to start</dt>
          <dd className="font-semibold tabular-nums">{formatMoney(order.depositAmount ?? 0)}</dd>
        </div>
      )}
    </dl>
  )
}
