import type { PriceBook } from "@/types/catalog"
import type { AeroKit, Visor } from "@/types/templates"

/**
 * The builder's catalogue with every price taken out, for the own-helmet page's 3D sketch
 * pad: the options all stay, but nothing shows an amount. (Films can't be unpriced, so
 * they're free; options, spoilers and visors become "not priced", which shows nothing.)
 */
export function withoutPrices(priceBook: PriceBook): PriceBook {
  return {
    ...priceBook,
    films: priceBook.films.map((film) => ({ ...film, price: 0 })),
    options: Object.fromEntries(
      Object.entries(priceBook.options).map(([group, options]) => [group, options.map((option) => ({ ...option, price: null }))]),
    ) as PriceBook["options"],
  }
}

export function kitsWithoutPrices<T extends AeroKit | Visor>(items: T[]): T[] {
  return items.map((item) => ({ ...item, price: null }))
}
