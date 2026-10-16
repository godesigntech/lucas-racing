import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, PartyPopper } from "lucide-react"

import { DeliveryDetails } from "@/components/orders/delivery-details"
import { InfoCard } from "@/components/orders/info-card"
import { OrderItems } from "@/components/orders/order-items"
import { OrderProgress } from "@/components/orders/order-progress"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { OrderTotals } from "@/components/orders/order-totals"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getMyOrder } from "@/lib/data/account"
import { formatDateTime } from "@/lib/format"
import { orderStatusMeta, paymentStatusMeta } from "@/lib/orders/status"

export const metadata = { title: "Order details" }

export default function AccountOrderPage({ params, searchParams }: PageProps<"/account/orders/[orderNumber]">) {
  return (
    <>
      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-carbon"
      >
        <ArrowLeft className="size-4" aria-hidden /> All orders
      </Link>
      <Suspense fallback={<OrderSkeleton />}>
        {Promise.all([params, searchParams]).then(([{ orderNumber }, query]) => (
          <OrderDetail orderNumber={orderNumber} justPlaced={query.placed === "1"} />
        ))}
      </Suspense>
    </>
  )
}

async function OrderDetail({ orderNumber, justPlaced }: { orderNumber: string; justPlaced: boolean }) {
  const order = await getMyOrder(decodeURIComponent(orderNumber))

  return (
    <div className="space-y-6">
      {justPlaced && (
        <div className="flex gap-4 rounded-3xl bg-brand p-5 text-carbon" role="status">
          <PartyPopper className="mt-0.5 size-6 shrink-0" aria-hidden />
          <div>
            <p className="font-display text-2xl font-bold uppercase">Order placed. Thank you!</p>
            <p className="text-sm">
              We&apos;ll email your digital proof to {order.customerEmail}. Once you approve it, we&apos;ll send a payment
              link and get started.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
          <h1 className="display mt-2 text-5xl sm:text-6xl">{order.orderNumber}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <InfoCard title="Progress">
        <OrderProgress status={order.status} />
        <p className="mt-4 text-sm text-muted-foreground">
          {orderStatusMeta[order.status].description}{" "}
          {order.status !== "cancelled" && paymentStatusMeta[order.paymentStatus].description}
        </p>
      </InfoCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <InfoCard title="Helmets">
          <OrderItems items={order.items} />
          <div className="mt-6 border-t border-carbon/10 pt-5">
            <OrderTotals order={order} />
          </div>
        </InfoCard>

        <div className="space-y-6">
          <InfoCard title="Delivery">
            <DeliveryDetails order={order} />
          </InfoCard>
          {order.customerNotes && (
            <InfoCard title="Your notes">
              <p className="whitespace-pre-line text-sm text-carbon/80">{order.customerNotes}</p>
            </InfoCard>
          )}
          <InfoCard title="History">
            <OrderTimeline events={order.events} />
          </InfoCard>
        </div>
      </div>
    </div>
  )
}

function OrderSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading order">
      <Skeleton className="h-16 w-72" />
      <Skeleton className="h-28 rounded-3xl" />
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  )
}
