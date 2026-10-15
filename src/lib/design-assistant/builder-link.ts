import { configToSearchParams, normaliseConfiguration } from "@/lib/configurator/helmet-configuration"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"
import type { HelmetLook } from "@/types/helmet"
import type { CatalogProduct } from "@/types/product"

import { colourDistance } from "./colour"

/** The builder's paint swatch closest to a colour, so a concept opens with the nearest colours we offer. */
function nearestSwatch(options: PriceBook["options"]["base"], colour: string): string | undefined {
  return options
    .filter((option) => option.isActive && option.swatch)
    .sort((a, b) => colourDistance(a.swatch!, colour) - colourDistance(b.swatch!, colour))[0]?.value
}

/**
 * A link that opens the helmet builder on a design with a concept's colours and finish.
 * Uses the builder's share-link format; anything that can't be matched falls back
 * to the design's own colours.
 */
export function builderHref(product: CatalogProduct, look: HelmetLook, priceBook: PriceBook): string {
  const draft: Partial<HelmetConfiguration> = {
    template: product.slug,
    finish: look.finish === "matte" ? "matte" : "gloss",
    baseKind: look.finish === "chrome" ? "chrome" : "colour",
    base: look.finish === "chrome" ? "chrome" : nearestSwatch(priceBook.options.base, look.base),
    graphicKind: "colour",
    graphic: nearestSwatch(priceBook.options.base, look.graphic),
    accentKind: "colour",
    accent: nearestSwatch(priceBook.options.base, look.accent),
    trim: nearestSwatch(priceBook.options.trim, look.trim),
    spoiler: look.spoiler ? "yes" : "no",
  }
  const config = normaliseConfiguration(draft, product, priceBook)
  return `/helmet-builder?${configToSearchParams(config)}`
}
