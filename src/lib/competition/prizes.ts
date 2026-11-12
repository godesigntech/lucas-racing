import { pickableFilms } from "@/lib/configurator/helmet-configuration"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"

/**
 * The prize for each place. 1st is the helmet; the rest are vouchers off a custom helmet
 * finish. issue_competition_vouchers() gives the same percentages (2nd-5th, then 10%).
 */
export const competitionPrizes: { place: string; prize: string; percentOff?: number }[] = [
  { place: "1st", prize: "A brand-new Arai SK-6 finished in your winning design, with a spoiler and clear visor. We'll cover UK postage if needed." },
  { place: "2nd", prize: "50% off your custom helmet finish", percentOff: 50 },
  { place: "3rd", prize: "40% off your custom helmet finish", percentOff: 40 },
  { place: "4th", prize: "30% off your custom helmet finish", percentOff: 30 },
  { place: "5th", prize: "20% off your custom helmet finish", percentOff: 20 },
  { place: "6th onwards", prize: "10% off your custom helmet finish", percentOff: 10 },
]

/** The places the workshop records in admin from the vote (the winner is chosen separately). */
export const recordablePlaces = [2, 3, 4, 5] as const

/**
 * Whether a design uses at least one hydrographic film, as entries must: on a part of the
 * design or on the spoilers. The customer's own printed pattern and holographic tape don't
 * count. enter_competition() checks the same.
 */
export function designHasHydroFilm(config: HelmetConfiguration, priceBook: PriceBook): boolean {
  const films = new Set(pickableFilms(priceBook).map((film) => film.id))
  const regions = Object.values(config.regions ?? {})
  if (regions.some((treatment) => treatment.kind === "film" && films.has(treatment.value))) return true
  return config.spoilerFinish?.kind === "film" && films.has(config.spoilerFinish.value)
}
