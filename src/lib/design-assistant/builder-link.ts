import type { PriceBook } from "@/types/catalog"
import type { ConfigKey } from "@/types/configurator"
import type { HelmetLook } from "@/types/helmet"
import type { CatalogProduct } from "@/types/product"

import { colourDistance } from "./colour"

/** The builder's swatch closest to a colour, so a concept opens with the nearest colours we offer. */
function nearestSwatch(options: PriceBook["options"]["base"], colour: string): string | undefined {
  return options
    .filter((option) => option.swatch)
    .sort((a, b) => colourDistance(a.swatch!, colour) - colourDistance(b.swatch!, colour))[0]?.value
}

/**
 * A link that opens a design in the builder with a concept's colours and finish.
 * Uses the same search params as the builder's share links; anything we can't
 * map is left out and the builder uses its default.
 */
export function builderHref(product: CatalogProduct, look: HelmetLook, priceBook: PriceBook): string {
  const offered = (group: keyof PriceBook["options"], value: string) =>
    priceBook.options[group].some((option) => option.value === value) ? value : undefined

  const config: Partial<Record<ConfigKey, string | undefined>> = {
    finish: offered("finish", look.finish),
    base: nearestSwatch(priceBook.options.base, look.base),
    trim: nearestSwatch(priceBook.options.trim, look.trim),
    film: priceBook.films.find((film) => film.pattern === look.film)?.id,
    spoiler: offered("spoiler", look.spoiler ? "yes" : "no"),
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(config)) if (value) params.set(key, value)
  const search = params.toString()
  return `/products/${product.slug}/customize${search ? `?${search}` : ""}`
}
