import { HelmetArt } from "@/components/helmet/helmet-art"
import type { ResolvedBasketLine } from "@/lib/basket/resolve-basket"
import { formatMoney } from "@/lib/format"

interface OrderSummaryCardProps {
  lines: Extract<ResolvedBasketLine, { available: true }>[]
  subtotal: number
  deliveryLabel?: string
  deliveryPrice: number
  children?: React.ReactNode
}

export function OrderSummaryCard({ lines, subtotal, deliveryLabel, deliveryPrice, children }: OrderSummaryCardProps) {
  return (
    <aside className="space-y-5 rounded-3xl bg-carbon p-6 text-paper" aria-label="Order summary">
      <h2 className="font-display text-3xl font-bold uppercase">Your order</h2>
      <ul className="space-y-4">
        {lines.map((line) => (
          <li key={line.item.id} className="flex items-center gap-3">
            <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-paper/95 p-1.5">
              <HelmetArt look={line.look} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{line.product.name}</span>
              <span className="block truncate text-xs text-paper/55">
                {line.summary.find((row) => row.key === "model")?.value} · Size {line.item.config.size}
                {line.item.quantity > 1 && ` · ×${line.item.quantity}`}
              </span>
            </span>
            <span className="text-sm font-semibold tabular-nums">{formatMoney(line.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-white/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-paper/60">Subtotal</dt>
          <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-paper/60">Delivery{deliveryLabel && ` · ${deliveryLabel}`}</dt>
          <dd className="tabular-nums">{deliveryPrice ? formatMoney(deliveryPrice) : "Free"}</dd>
        </div>
      </dl>
      <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
        <span className="text-sm text-paper/60">Total</span>
        <span className="font-display text-4xl font-bold">{formatMoney(subtotal + deliveryPrice)}</span>
      </div>
      {children}
    </aside>
  )
}
