import type { PriceBook } from "@/types/catalog"
import type { LogoPlacementItem } from "@/types/configurator"

/**
 * Dips and prints are priced by how much of the helmet they cover: a dip on a zone
 * covering 30% of the shell costs 30% of a whole-helmet dip ("coverage" options in admin,
 * £400 to start), and a print or uploaded image the same share of a whole-helmet print
 * (£800). place_order() uses the same formulas.
 */
export type CoverageKind = "dip" | "print"

/**
 * How much of the helmet an uploaded image covers. At size 1 it's drawn 0.3 of a helmet
 * face wide (design-textures.ts); the helmet counts as four faces, and "both sides" prints
 * it twice. Measured on its bounding square, since the picture's shape isn't known here.
 */
export function imageCoverage(item: Pick<LogoPlacementItem, "scale" | "position">): number {
  const scale = Math.min(3, Math.max(0.3, item.scale ?? 1))
  return Math.min(1, ((0.3 * scale) ** 2 / 4) * (item.position === "sides" ? 2 : 1))
}

/** The price of covering this share of the helmet, in whole pounds; null while unpriced. */
export function coveragePrice(priceBook: PriceBook, kind: CoverageKind, coverage: number): number | null {
  const option = priceBook.options.coverage?.find((item) => item.value === kind && item.isActive)
  if (!option || option.price === null) return null
  // toFixed first, so floating-point dust (40.4999…) rounds like the database's exact maths.
  return Math.round(Number((option.price * coverage).toFixed(6)))
}

/** "about 12% of the helmet" */
export function coverageLabel(coverage: number): string {
  return `about ${Math.max(1, Math.round(coverage * 100))}% of the helmet`
}
