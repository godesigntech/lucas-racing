import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, PriceBreakdown, PriceLine } from "@/types/configurator"

/**
 * Price of one configured helmet. Mirrors public.place_order() in the database,
 * which is the source of truth at checkout; this copy is for showing prices.
 * Returns null for designs that are priced on request.
 */
export function calculateHelmetPrice(
  basePrice: number | null,
  config: HelmetConfiguration,
  priceBook: PriceBook,
): PriceBreakdown | null {
  if (basePrice === null) return null

  const lines: PriceLine[] = [{ label: "Design and finishing", amount: basePrice }]
  const model = priceBook.models.find((item) => item.id === config.model)

  if (config.route === "new" && model) {
    lines.push({ label: `New ${model.name}`, amount: model.newHelmetPrice })
  }

  const optionGroups = ["route", "finish", "base", "trim", "spoiler"] as const
  for (const group of optionGroups) {
    if (group === "base" && config.finish === "chrome") continue
    const option = priceBook.options[group].find((item) => item.value === config[group])
    if (option && option.price > 0) lines.push({ label: option.label, amount: option.price })
  }

  const film = priceBook.films.find((item) => item.id === config.film)
  if (film && film.price > 0) lines.push({ label: `${film.name} film`, amount: film.price })

  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0) }
}
