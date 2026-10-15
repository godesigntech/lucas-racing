import {
  calculateHelmetPrice,
  configurationToLook,
  normaliseConfiguration,
  summariseConfiguration,
} from "@/lib/configurator/helmet-configuration"
import type { PriceBook } from "@/types/catalog"
import type { ConfigSummaryLine } from "@/types/configurator"
import type { HelmetLook } from "@/types/helmet"
import type { CatalogProduct } from "@/types/product"

import type { BasketItem } from "./basket-store"

export type ResolvedBasketLine =
  | {
      available: true
      item: BasketItem
      product: CatalogProduct
      look: HelmetLook
      summary: ConfigSummaryLine[]
      unitPrice: number
      lineTotal: number
    }
  | { available: false; item: BasketItem }

/**
 * Re-prices a basket line against the current catalogue (prices may have changed since
 * it was added). Older lines are brought up to the current build format.
 */
export function resolveBasketLine(item: BasketItem, products: CatalogProduct[], priceBook: PriceBook): ResolvedBasketLine {
  const product = products.find((candidate) => candidate.slug === item.slug)
  if (!product || !product.models.includes(item.config.model)) return { available: false, item }

  const config = normaliseConfiguration(item.config, product, priceBook)
  const price = calculateHelmetPrice(product, config, priceBook)
  if (!price) return { available: false, item }

  return {
    available: true,
    item: { ...item, config },
    product,
    look: configurationToLook(product, config, priceBook),
    summary: summariseConfiguration(product, config, priceBook),
    unitPrice: price.total,
    lineTotal: price.total * item.quantity,
  }
}

export function basketSubtotal(lines: ResolvedBasketLine[]): number {
  return lines.reduce((sum, line) => sum + (line.available ? line.lineTotal : 0), 0)
}
