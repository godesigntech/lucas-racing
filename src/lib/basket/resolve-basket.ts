import {
  configurationToLook,
  getOptionGroups,
  normaliseConfiguration,
  summariseConfiguration,
} from "@/lib/configurator/helmet-configuration"
import { calculateHelmetPrice } from "@/lib/pricing/helmet-price"
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

/** Re-prices a basket line against the current catalogue (prices may have changed since it was added). */
export function resolveBasketLine(
  item: BasketItem,
  products: CatalogProduct[],
  priceBook: PriceBook,
): ResolvedBasketLine {
  const product = products.find((candidate) => candidate.slug === item.slug)
  if (!product || !product.models.includes(item.config.model)) return { available: false, item }

  const config = normaliseConfiguration(item.config, product, priceBook)
  const price = calculateHelmetPrice(product.startingPrice, config, priceBook)
  if (!price) return { available: false, item }

  const groups = getOptionGroups(product, priceBook, config)
  return {
    available: true,
    item: { ...item, config },
    product,
    look: configurationToLook(product, config, priceBook),
    summary: summariseConfiguration(groups, config),
    unitPrice: price.total,
    lineTotal: price.total * item.quantity,
  }
}

export function basketSubtotal(lines: ResolvedBasketLine[]): number {
  return lines.reduce((sum, line) => sum + (line.available ? line.lineTotal : 0), 0)
}
