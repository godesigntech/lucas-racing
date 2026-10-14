import Link from "next/link"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { formatMoney } from "@/lib/format"
import type { OrderItem } from "@/types/order"

interface OrderItemsProps {
  items: OrderItem[]
  /** Link item names to the public product page. */
  linkProducts?: boolean
}

/** Ordered helmets with their full configuration, as captured at checkout. */
export function OrderItems({ items, linkProducts = true }: OrderItemsProps) {
  return (
    <ul className="divide-y divide-carbon/10">
      {items.map((item) => (
        <li key={item.id} className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)]">
          <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_75%)] p-2">
            {item.look ? <HelmetArt look={item.look} /> : null}
          </div>
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-xl font-bold uppercase">
                {linkProducts ? (
                  <Link href={`/products/${item.productSlug}`} className="underline-offset-4 hover:underline">
                    {item.productName}
                  </Link>
                ) : (
                  item.productName
                )}
                {item.quantity > 1 && <span className="ml-2 text-base text-muted-foreground">× {item.quantity}</span>}
              </h3>
              <span className="font-semibold tabular-nums">{formatMoney(item.lineTotal)}</span>
            </div>
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {item.summary.map((line) => (
                <div key={line.label} className="flex justify-between gap-3 border-b border-carbon/5 py-1">
                  <dt className="text-muted-foreground">{line.label}</dt>
                  <dd className="text-right font-medium">{line.value}</dd>
                </div>
              ))}
            </dl>
            {item.quantity > 1 && (
              <p className="text-xs text-muted-foreground">{formatMoney(item.unitPrice)} each</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
