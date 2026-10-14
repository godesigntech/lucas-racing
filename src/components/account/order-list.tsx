import Link from "next/link"
import { ChevronRight, Package } from "lucide-react"

import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { formatDate, formatMoney } from "@/lib/format"
import type { OrderListItem } from "@/types/order"

/** A customer's orders as tappable rows. */
export function OrderList({ orders }: { orders: OrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you order a custom helmet it will appear here, with its status at every step."
        action={
          <Button asChild>
            <Link href="/products">Browse helmet designs</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className="divide-y divide-carbon/10 overflow-hidden rounded-3xl border border-carbon/10 bg-card">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.orderNumber}`}
            className="group grid gap-3 p-5 transition-colors hover:bg-foreground/[0.03] sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
          >
            <div className="min-w-0">
              <p className="font-display text-xl font-bold uppercase">{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "helmet" : "helmets"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="font-semibold tabular-nums">{formatMoney(order.total)}</span>
              <ChevronRight
                className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
