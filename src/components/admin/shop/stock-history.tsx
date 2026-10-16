import Link from "next/link"

import { formatDateTime } from "@/lib/format"
import { variantLabel } from "@/lib/shop/stock"
import { cn } from "@/lib/utils"
import type { InventoryMovement, ShopVariant } from "@/types/shop"

const reasonLabels: Record<InventoryMovement["reason"], string> = {
  order: "Sold",
  cancellation: "Order cancelled",
  adjustment: "Stock count",
  import: "Import",
}

/** The latest stock changes for a product's options. */
export function StockHistory({ movements, variants }: { movements: InventoryMovement[]; variants: ShopVariant[] }) {
  if (movements.length === 0) {
    return <p className="text-sm text-muted-foreground">No stock changes yet.</p>
  }
  const labels = new Map(variants.map((variant) => [variant.id, variantLabel(variant) || "Standard"]))

  return (
    <ul className="divide-y divide-carbon/10 text-sm">
      {movements.map((movement) => (
        <li key={movement.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="font-medium">
              {reasonLabels[movement.reason]}
              {variants.length > 1 && <span className="font-normal text-muted-foreground"> · {labels.get(movement.variantId)}</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(movement.createdAt)}
              {movement.note && ` · ${movement.note}`}
            </p>
            {movement.orderId && (
              <Link href={`/admin/orders/${movement.orderId}`} className="text-xs font-medium underline-offset-4 hover:underline">
                View order
              </Link>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("font-semibold tabular-nums", movement.change > 0 ? "text-emerald-700" : "text-destructive")}>
              {movement.change > 0 ? `+${movement.change}` : movement.change}
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">now {movement.quantityAfter}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
