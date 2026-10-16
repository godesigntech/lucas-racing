import type { ShopVariant, StockStatus } from "@/types/shop"

/** At or below this many, the shop says "Low stock". */
export const LOW_STOCK = 3

export function stockStatus(variant: Pick<ShopVariant, "stockQuantity" | "trackStock" | "allowBackorder">): StockStatus {
  if (!variant.trackStock) return "untracked"
  if (variant.stockQuantity <= 0) return variant.allowBackorder ? "backorder" : "out_of_stock"
  return variant.stockQuantity <= LOW_STOCK ? "low_stock" : "in_stock"
}

/** Can this many be bought right now? */
export function canBuy(variant: Pick<ShopVariant, "stockQuantity" | "trackStock" | "allowBackorder">, quantity = 1): boolean {
  return !variant.trackStock || variant.allowBackorder || variant.stockQuantity >= quantity
}

/** The most a customer can put in the basket (stock, or the per-line limit). */
export function maxQuantity(variant: Pick<ShopVariant, "stockQuantity" | "trackStock" | "allowBackorder">, limit = 99): number {
  if (!variant.trackStock || variant.allowBackorder) return limit
  return Math.max(0, Math.min(limit, variant.stockQuantity))
}

export const stockLabels: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  backorder: "Available to order",
  untracked: "Available",
}

/** "Size M · Colour Black", or "" for single-variant products. */
export function variantLabel(variant: Pick<ShopVariant, "options">): string {
  return Object.entries(variant.options)
    .map(([name, value]) => `${name} ${value}`)
    .join(" · ")
}
