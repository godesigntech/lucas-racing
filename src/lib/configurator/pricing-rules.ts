import { BESPOKE_PRINT_FILM } from "@/lib/configurator/helmet-configuration"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"

/** Share of the price paid up front. */
export const DEPOSIT_RATE = 0.2
/** Added to the deposit for each helmet with a chrome base coat. */
export const CHROME_DEPOSIT = 200

/**
 * Why a build has to be priced by hand. Empty for builds made only from a template,
 * colours and finishes, which can be ordered at their set price. The same rule as
 * public.build_needs_quote(), which place_order() enforces.
 */
export function quoteReasons(config: HelmetConfiguration, priceBook: PriceBook): string[] {
  const reasons: string[] = []
  const regionFilms = Object.values(config.regions ?? {}).filter((treatment) => treatment.kind === "film" && !treatment.value.startsWith("holo-"))
  if (regionFilms.some((treatment) => treatment.value === BESPOKE_PRINT_FILM)) reasons.push("Your own pattern printed on the helmet")
  const films = regionFilms
    .filter((treatment) => treatment.value !== BESPOKE_PRINT_FILM)
    .map((treatment) => priceBook.films.find((film) => film.id === treatment.value)?.name ?? "Film")
  const legacy = !config.regions && [config.baseKind, config.graphicKind, config.accentKind].includes("film")
  if (films.length > 0 || legacy) reasons.push(`Dip on the helmet${films.length ? `: ${[...new Set(films)].join(", ")}` : ""}`)
  if (config.spoilerFinish?.kind === "film" && (config.spoilers?.length ?? 0) > 0) reasons.push("Dip on the spoilers")
  const images = (config.logos ?? []).filter((logo) => logo.kind === "image").length
  if (images > 0) reasons.push(images === 1 ? "A bespoke image" : `${images} bespoke images`)
  return reasons
}

/** The deposit on a priced helmet: 20%, plus £200 with a chrome base coat. */
export function helmetDeposit(total: number, config: Pick<HelmetConfiguration, "baseCoat">): number {
  return roundMoney(total * DEPOSIT_RATE) + (config.baseCoat === "chrome" ? CHROME_DEPOSIT : 0)
}

/** How many helmets in these basket lines have a chrome base coat. */
export function chromeHelmetCount(lines: { kind: string; quantity: number; item: unknown }[]): number {
  return lines.reduce((count, line) => {
    const config = line.kind === "helmet" ? (line.item as { config?: { baseCoat?: string } }).config : undefined
    return count + (config?.baseCoat === "chrome" ? line.quantity : 0)
  }, 0)
}

/** The deposit on an order, as place_order() records it. */
export function orderDeposit(total: number, chromeHelmets: number): number {
  return roundMoney(total * DEPOSIT_RATE) + CHROME_DEPOSIT * chromeHelmets
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}
