import type { AvailableLine } from "@/lib/basket/resolve-basket"
import type { PriceBook } from "@/types/catalog"

/**
 * What a voucher takes off: its percentage of one custom helmet finish, the dearest in the
 * basket. A new helmet shell bought with it isn't discounted, nor is delivery.
 * place_order_with_voucher() works it out the same way; this is the preview at checkout.
 */
export function voucherDiscount(lines: AvailableLine[], percentOff: number, priceBook: PriceBook): number {
  let finish = 0
  for (const line of lines) {
    if (line.kind !== "helmet") continue
    const config = line.item.config
    const shell = config.route === "new" ? (priceBook.models.find((model) => model.id === config.model)?.newHelmetPrice ?? 0) : 0
    finish = Math.max(finish, line.unitPrice - shell)
  }
  return Math.round(Math.max(0, finish) * percentOff) / 100
}
