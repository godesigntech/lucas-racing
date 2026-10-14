import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, formatMoney } from "@/lib/format"
import type { OrderListItem } from "@/types/order"

interface OrdersTableProps {
  orders: OrderListItem[]
  /** Hide the customer column, e.g. on a customer's own page. */
  hideCustomer?: boolean
  emptyMessage?: string
}

/** Orders as a table on desktop and stacked rows on mobile. Rows open the order. */
export function OrdersTable({ orders, hideCustomer, emptyMessage = "No orders yet." }: OrdersTableProps) {
  if (orders.length === 0) {
    return <p className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <>
      <ul className="divide-y divide-carbon/10 md:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-foreground/[0.03]">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{order.orderNumber}</span>
                  <span className="font-semibold tabular-nums">{formatMoney(order.total)}</span>
                </div>
                {!hideCustomer && <p className="truncate text-sm text-muted-foreground">{order.customerName}</p>}
                <div className="flex flex-wrap items-center gap-1.5">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Order</TableHead>
            <TableHead>Date</TableHead>
            {!hideCustomer && <TableHead>Customer</TableHead>}
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-5">Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="group relative">
              <TableCell className="pl-5 font-semibold">
                <Link href={`/admin/orders/${order.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline">
                  {order.orderNumber}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
              {!hideCustomer && (
                <TableCell>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                </TableCell>
              )}
              <TableCell className="text-right tabular-nums">{order.itemCount}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatMoney(order.total)}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="pr-5">
                <PaymentStatusBadge status={order.paymentStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
