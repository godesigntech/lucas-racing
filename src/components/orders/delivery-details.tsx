import type { Order } from "@/types/order"

/** Delivery method plus address (when one was needed). */
export function DeliveryDetails({ order }: { order: Pick<Order, "deliveryLabel" | "shippingAddress"> }) {
  const address = order.shippingAddress
  const lines = [address.line1, address.line2, address.city, address.county, address.postcode, address.country].filter(Boolean)

  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold">{order.deliveryLabel}</p>
      {lines.length > 0 ? (
        <address className="not-italic leading-relaxed text-carbon/80">
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
      ) : (
        <p className="text-muted-foreground">No delivery address needed.</p>
      )}
    </div>
  )
}
