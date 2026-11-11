import { BESPOKE_PRINT_FILM } from "@/lib/configurator/helmet-configuration"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"

/** Share of the price paid up front to book a production slot. */
export const DEPOSIT_RATE = 0.1

/**
 * Why a build has to be priced by hand instead of by the website. Dips, prints and images
 * are priced by coverage now (coverage-pricing.ts), so every build from the builder has a
 * price and this is empty; it's kept so a future option the website can't price can send
 * the build for a quote again. (The rules below are no longer applied.)
 */
export function quoteReasons(config: HelmetConfiguration, priceBook: PriceBook): string[] {
  void config
  void priceBook
  return []
}

/** The old rule: a bespoke image or a dip meant a quote. Kept for reference only. */
export function legacyQuoteReasons(config: HelmetConfiguration, priceBook: PriceBook): string[] {
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

/** The chrome base coat's price, which is paid in full with the deposit. */
export function chromeBaseCoatPrice(priceBook: PriceBook): number {
  return priceBook.options.material.find((option) => option.value === "chrome")?.price ?? 0
}

/** The deposit on a helmet: 10% to book the slot, plus the chrome base coat in full. */
export function helmetDeposit(total: number, config: Pick<HelmetConfiguration, "baseCoat">, chromePrice: number): number {
  return roundMoney(total * DEPOSIT_RATE) + (config.baseCoat === "chrome" ? chromePrice : 0)
}

/** How many helmets in these basket lines have a chrome base coat. */
export function chromeHelmetCount(lines: { kind: string; quantity: number; item: unknown }[]): number {
  return lines.reduce((count, line) => {
    const config = line.kind === "helmet" ? (line.item as { config?: { baseCoat?: string } }).config : undefined
    return count + (config?.baseCoat === "chrome" ? line.quantity : 0)
  }, 0)
}

/** The deposit on an order, as order_items_set_deposit() records it. */
export function orderDeposit(total: number, chromeHelmets: number, chromePrice: number): number {
  return roundMoney(total * DEPOSIT_RATE) + chromePrice * chromeHelmets
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}
