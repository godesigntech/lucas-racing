import Image from "next/image"
import { Package } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import type { AvailableLine } from "@/lib/basket/resolve-basket"
import { formatMoney } from "@/lib/format"
import { isExternalImage } from "@/lib/shop/images"

interface OrderSummaryCardProps {
  lines: AvailableLine[]
  subtotal: number
  deliveryLabel?: string
  deliveryPrice: number
  /** Charged when the customer picks a faster turnaround than standard. */
  rushFee?: number
  rushLabel?: string
  children?: React.ReactNode
}

function LineThumb({ line }: { line: AvailableLine }) {
  if (line.kind === "helmet") return <HelmetArt look={line.look} />
  const image = line.product.images[0]
  return image ? (
    <span className="relative block size-full">
      <Image src={image} alt="" fill sizes="64px" unoptimized={isExternalImage(image)} className="object-contain" />
    </span>
  ) : (
    <Package className="size-6 text-carbon/50" aria-hidden />
  )
}

function lineDetail(line: AvailableLine): string {
  const parts =
    line.kind === "helmet"
      ? [line.summary.find((row) => row.key === "model")?.value, `Size ${line.item.config.size}`]
      : [line.variantLabel, ...line.finishSummary.map((row) => row.value)]
  if (line.quantity > 1) parts.push(`×${line.quantity}`)
  return parts.filter(Boolean).join(" · ")
}

export function OrderSummaryCard({
  lines,
  subtotal,
  deliveryLabel,
  deliveryPrice,
  rushFee = 0,
  rushLabel,
  children,
}: OrderSummaryCardProps) {
  return (
    <aside className="space-y-5 rounded-3xl bg-carbon p-6 text-paper" aria-label="Order summary">
      <h2 className="font-display text-3xl font-bold uppercase">Your order</h2>
      <ul className="space-y-4">
        {lines.map((line) => (
          <li key={line.item.id} className="flex items-center gap-3">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-paper/95 p-1.5">
              <LineThumb line={line} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{line.kind === "helmet" ? line.product.name : line.product.title}</span>
              <span className="block truncate text-xs text-paper/55">{lineDetail(line)}</span>
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
        {rushFee > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-paper/60">{rushLabel ?? "Faster turnaround"}</dt>
            <dd className="tabular-nums">{formatMoney(rushFee)}</dd>
          </div>
        )}
      </dl>
      <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
        <span className="text-sm text-paper/60">Total</span>
        <span className="font-display text-4xl font-bold">{formatMoney(subtotal + deliveryPrice + rushFee)}</span>
      </div>
      {children}
    </aside>
  )
}
