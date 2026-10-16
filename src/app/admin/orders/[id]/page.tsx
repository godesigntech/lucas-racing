import { Suspense } from "react"
import Link from "next/link"
import { Mail, Phone, UserRound } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminNotesForm } from "@/components/admin/admin-notes-form"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { OrderStatusForm } from "@/components/admin/order-status-form"
import { DeliveryDetails } from "@/components/orders/delivery-details"
import { OrderItems } from "@/components/orders/order-items"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { OrderTotals } from "@/components/orders/order-totals"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminOrder, getOrderLogos } from "@/lib/data/admin"
import { formatDateTime } from "@/lib/format"

export const metadata = { title: "Order" }

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
      {params.then(({ id }) => (
        <OrderDetail id={id} />
      ))}
    </Suspense>
  )
}

async function OrderDetail({ id }: { id: string }) {
  const order = await getAdminOrder(id)
  const logos = await getOrderLogos(order)

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)} · last updated ${formatDateTime(order.updatedAt)}`}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <AdminCard title={`Items (${order.itemCount})`}>
            <OrderItems items={order.items} />
            <div className="mt-6 border-t border-carbon/10 pt-5">
              <OrderTotals order={order} />
            </div>
          </AdminCard>

          {logos.length > 0 && (
            <AdminCard title="Customer logos" description="Uploaded in the builder. Links work for an hour; reload to refresh them.">
              <ul className="grid gap-3 sm:grid-cols-3">
                {logos.map((logo, index) => (
                  <li key={logo.url}>
                    <a href={logo.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-carbon/10 p-2 transition-colors hover:border-carbon/30">
                      {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL */}
                      <img src={logo.url} alt={`Logo for ${logo.itemName}`} className="aspect-square w-full rounded-lg bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:16px_16px] object-contain" />
                      <span className="mt-2 block text-xs text-muted-foreground">
                        {logo.itemName} · helmet {index + 1}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}

          {order.customerNotes && (
            <AdminCard title="Customer notes">
              <p className="whitespace-pre-line text-sm">{order.customerNotes}</p>
            </AdminCard>
          )}

          <AdminCard title="Internal notes" description="Private to admins.">
            <AdminNotesForm orderId={order.id} adminNotes={order.adminNotes} />
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Update order">
            <OrderStatusForm orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />
          </AdminCard>

          <AdminCard
            title="Customer"
            action={
              order.userId ? (
                <Link href={`/admin/customers/${order.userId}`} className="text-sm font-medium underline-offset-4 hover:underline">
                  View profile
                </Link>
              ) : undefined
            }
          >
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="font-medium">{order.customerName}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <a href={`mailto:${order.customerEmail}`} className="break-all underline-offset-4 hover:underline">
                  {order.customerEmail}
                </a>
              </li>
              {order.customerPhone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <a href={`tel:${order.customerPhone.replace(/\s/g, "")}`} className="underline-offset-4 hover:underline">
                    {order.customerPhone}
                  </a>
                </li>
              )}
            </ul>
          </AdminCard>

          <AdminCard title="Delivery">
            <DeliveryDetails order={order} />
          </AdminCard>

          <AdminCard title="History">
            <OrderTimeline events={order.events} />
          </AdminCard>
        </div>
      </div>
    </>
  )
}
