import type { PartsDiscountTier } from "@/types/settings"

import type { AvailableLine } from "./resolve-basket"

export interface PartsDiscount {
  /** How many custom-finished parts are in the basket (a pair or set counts once). */
  parts: number
  percent: number
  /** Taken off those parts' total. */
  amount: number
  /** The next step up, to tell the customer what one more part would save. */
  next?: PartsDiscountTier
}

/**
 * The kart parts quantity discount, worked out the same way as order_parts_discount() in
 * the database: custom-finished parts only, the highest step the count reaches, off those
 * parts' total.
 */
export function partsDiscount(lines: AvailableLine[], tiers: PartsDiscountTier[]): PartsDiscount {
  const finished = lines.filter((line) => line.kind === "product" && line.item.finish)
  const parts = finished.reduce((sum, line) => sum + line.quantity, 0)
  const total = finished.reduce((sum, line) => sum + line.lineTotal, 0)
  const sorted = [...tiers].sort((a, b) => a.parts - b.parts)
  const percent = Math.min(100, sorted.filter((tier) => tier.parts <= parts).reduce((best, tier) => Math.max(best, tier.percent), 0))
  return {
    parts,
    percent,
    amount: Math.round(total * percent) / 100,
    next: parts > 0 ? sorted.find((tier) => tier.parts > parts && tier.percent > percent) : undefined,
  }
}

/** "2 parts 10% · 3 parts 20% · 5+ parts 40%", for notices. */
export function describeTiers(tiers: PartsDiscountTier[]): string {
  const sorted = [...tiers].sort((a, b) => a.parts - b.parts)
  return sorted.map((tier, index) => `${tier.parts}${index === sorted.length - 1 ? "+" : ""} parts ${tier.percent}%`).join(" · ")
}
