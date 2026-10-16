import {
  calculateHelmetPrice,
  configurationToLook,
  normaliseConfiguration,
  summariseConfiguration,
} from "@/lib/configurator/helmet-configuration"
import { maxQuantity, stockStatus, variantLabel } from "@/lib/shop/stock"
import type { PriceBook } from "@/types/catalog"
import type { ConfigSummaryLine } from "@/types/configurator"
import type { HelmetLook } from "@/types/helmet"
import type { CatalogProduct } from "@/types/product"
import type { ShopProduct, ShopVariant, StockStatus } from "@/types/shop"

import { isProductItem, type BasketItem, type HelmetBasketItem, type ProductBasketItem } from "./basket-store"
import type { LiveVariant } from "./use-live-variants"

export interface ResolvedHelmetLine {
  kind: "helmet"
  available: true
  item: HelmetBasketItem
  product: CatalogProduct
  look: HelmetLook
  summary: ConfigSummaryLine[]
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface ResolvedProductLine {
  kind: "product"
  available: true
  item: ProductBasketItem
  product: ShopProduct
  variant: ShopVariant
  variantLabel: string
  status: StockStatus
  /** Most that can be ordered now (stock or the per-line limit). */
  maxQuantity: number
  /** The quantity that will be ordered: the basket's, capped at what's in stock. */
  quantity: number
  /** Explains a reduced quantity, e.g. "Only 2 left". */
  note?: string
  unitPrice: number
  lineTotal: number
}

export interface UnavailableLine {
  kind: "helmet" | "product"
  available: false
  item: BasketItem
  reason: string
}

export type AvailableLine = ResolvedHelmetLine | ResolvedProductLine
export type ResolvedBasketLine = AvailableLine | UnavailableLine

export interface CatalogContext {
  products: CatalogProduct[]
  priceBook: PriceBook
  /** Live shop variants, from useLiveVariants(). */
  variants: Map<string, LiveVariant>
}

function resolveHelmetLine(item: HelmetBasketItem, { products, priceBook }: CatalogContext): ResolvedBasketLine {
  const unavailable = { kind: "helmet" as const, available: false as const, item, reason: "This design is no longer available, so it won't be ordered." }
  const product = products.find((candidate) => candidate.slug === item.slug)
  if (!product || !product.models.includes(item.config.model)) return unavailable

  const config = normaliseConfiguration(item.config, product, priceBook)
  const price = calculateHelmetPrice(product, config, priceBook)
  if (!price) return unavailable

  return {
    kind: "helmet",
    available: true,
    item: { ...item, config },
    product,
    look: configurationToLook(product, config, priceBook),
    summary: summariseConfiguration(product, config, priceBook),
    unitPrice: price.total,
    quantity: item.quantity,
    lineTotal: price.total * item.quantity,
  }
}

function resolveProductLine(item: ProductBasketItem, { variants }: CatalogContext): ResolvedBasketLine {
  const live = variants.get(item.variantId)
  if (!live) return { kind: "product", available: false, item, reason: "This item is no longer available, so it won't be ordered." }
  if (!live.purchasable) return { kind: "product", available: false, item, reason: "This item is ordered directly with our partner." }

  const status = stockStatus(live.variant)
  const max = maxQuantity(live.variant)
  if (max === 0) return { kind: "product", available: false, item, reason: "This item is now out of stock, so it won't be ordered." }

  const quantity = Math.min(item.quantity, max)
  return {
    kind: "product",
    available: true,
    item,
    product: live.product,
    variant: live.variant,
    variantLabel: variantLabel(live.variant),
    status,
    maxQuantity: max,
    quantity,
    note: quantity < item.quantity ? `Only ${max} left, so we've reduced the quantity.` : undefined,
    unitPrice: live.variant.price,
    lineTotal: live.variant.price * quantity,
  }
}

/**
 * Re-prices a basket line against the live catalogue (prices and stock may have
 * changed since it was added). Older helmet lines are brought up to the current format.
 */
export function resolveBasketLine(item: BasketItem, context: CatalogContext): ResolvedBasketLine {
  return isProductItem(item) ? resolveProductLine(item, context) : resolveHelmetLine(item, context)
}

export function basketSubtotal(lines: ResolvedBasketLine[]): number {
  return lines.reduce((sum, line) => sum + (line.available ? line.lineTotal : 0), 0)
}

/** What checkout sends to place_order(): helmet builds and product variants. */
export function toOrderItems(lines: AvailableLine[]) {
  return lines.map((line) =>
    line.kind === "product"
      ? { kind: "product" as const, variantId: line.variant.id, quantity: line.quantity }
      : { kind: "helmet" as const, slug: line.item.slug, quantity: line.item.quantity, config: line.item.config },
  )
}
