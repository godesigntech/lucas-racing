import { Suspense } from "react"
import Link from "next/link"
import { Mail, Phone, UserRound } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminNotesForm } from "@/components/admin/admin-notes-form"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { OrderStatusForm } from "@/components/admin/order-status-form"
import { OrderDesign } from "@/components/admin/orders/order-design"
import { OrderProofs } from "@/components/admin/orders/order-proofs"
import { PartPreviewCanvas } from "@/components/kart-parts/part-preview-canvas"
import { DeliveryDetails } from "@/components/orders/delivery-details"
import { OrderItems } from "@/components/orders/order-items"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { OrderTotals } from "@/components/orders/order-totals"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { requireOrderViewer } from "@/lib/auth/session"
import { getAdminOrder, getOrderDesigns, getOrderLogos } from "@/lib/data/admin"
import { getBuilderCatalog } from "@/lib/data/builder"
import { getPriceBook } from "@/lib/data/products"
import { listOrderProofs } from "@/lib/data/proofs"
import { getShopProductBySlug } from "@/lib/data/shop"
import { partPreview } from "@/lib/shop/part-finish"
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
  const [user, order] = await Promise.all([requireOrderViewer(), getAdminOrder(id)])
  // Teamwear staff can look, not change: no logos, notes or status updates.
  const canManage = user.isAdmin
  const [logos, proofs, designs, builder, priceBook] = await Promise.all([
    canManage ? getOrderLogos(order) : [],
    canManage ? listOrderProofs(order.id) : [],
    canManage ? getOrderDesigns(order) : [],
    getBuilderCatalog(),
    getPriceBook(),
  ])
  // Customised kart parts, drawn in the finish the customer chose.
  const partItems = order.items.filter((item) => item.kind === "product" && item.storeId === "hydrokarts-parts" && item.finish)
  const partProducts = await Promise.all(partItems.map((item) => getShopProductBySlug(item.productSlug)))
  const parts = partItems.flatMap((item, index) => {
    const product = partProducts[index]
    const preview = product ? partPreview(product) : null
    return preview && item.finish ? [{ item, preview, finish: item.finish }] : []
  })

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

          {designs.map((design, index) => {
            const item = order.items.find((candidate) => candidate.id === design.itemId)
            return (
              <AdminCard
                key={design.itemId}
                title={designs.length > 1 ? `Helmet ${index + 1}: ${design.product.name}` : `Helmet design: ${design.product.name}`}
                description="Exactly as the customer designed it. Drag to turn the helmet, or pick an angle."
              >
                <OrderDesign
                  product={design.product}
                  config={design.config}
                  priceBook={priceBook}
                  templates={builder.templates}
                  aeroKits={builder.aeroKits}
                  visors={builder.visors}
                  logoUrls={design.logoUrls}
                  summary={item?.summary ?? []}
                />
              </AdminCard>
            )
          })}

          {parts.length > 0 && (
            <AdminCard title="Custom parts" description="Each part drawn in the finish the customer chose.">
              <ul className="grid gap-4 sm:grid-cols-2">
                {parts.map(({ item, preview, finish }) => (
                  <li key={item.id} className="overflow-hidden rounded-2xl border border-carbon/10">
                    <PartPreviewCanvas preview={preview} finish={finish} priceBook={priceBook} label={`${item.productName} in the customer's finish`} className="aspect-square bg-white p-4" />
                    <div className="space-y-0.5 border-t border-carbon/10 p-3 text-sm">
                      <p className="font-semibold">
                        {item.productName} × {item.quantity}
                      </p>
                      {item.summary
                        .filter((line) => line.label === "Finish" || line.label === "Lacquer")
                        .map((line) => (
                          <p key={line.label} className="text-muted-foreground">
                            {line.label}: {line.value}
                          </p>
                        ))}
                    </div>
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}

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

          {canManage && <OrderProofs orderId={order.id} proofs={proofs} />}

          {order.customerNotes && (
            <AdminCard title="Customer notes">
              <p className="whitespace-pre-line text-sm">{order.customerNotes}</p>
            </AdminCard>
          )}

          {canManage && (
            <AdminCard title="Internal notes" description="Private to admins.">
              <AdminNotesForm orderId={order.id} adminNotes={order.adminNotes} />
            </AdminCard>
          )}
        </div>

        <div className="space-y-6">
          {canManage && (
            <AdminCard title="Update order">
              <OrderStatusForm orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />
            </AdminCard>
          )}

          <AdminCard
            title="Customer"
            action={
              order.userId && canManage ? (
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
