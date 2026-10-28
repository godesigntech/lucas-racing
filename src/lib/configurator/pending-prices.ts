import type { BuilderRegion } from "@/lib/configurator/regions"
import { getTreatment } from "@/lib/configurator/regions"
import type { ConfiguratorOption, PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"
import type { AeroKit, Visor } from "@/types/templates"

/**
 * Choices the workshop hasn't put a price against yet.
 *
 * The customer can still pick them and see them on the helmet — that's the point of a
 * builder — but we won't take an order until the price is agreed, because guessing it
 * would mean undercharging. public.place_order() refuses the same selections, so this is
 * the polite version of a rule the database enforces anyway.
 */

export interface PendingPrice {
  key: string
  label: string
}

function fromOption(option: ConfiguratorOption | undefined, key: string, label?: string): PendingPrice | null {
  return option && option.price === null ? { key, label: label ?? option.label } : null
}

export function pendingPrices(
  config: HelmetConfiguration,
  regions: BuilderRegion[],
  priceBook: PriceBook,
  extras: { aeroKits?: AeroKit[]; visors?: Visor[] } = {},
): PendingPrice[] {
  const pending: (PendingPrice | null)[] = []
  const find = (group: keyof PriceBook["options"], value: string | undefined) =>
    value === undefined ? undefined : priceBook.options[group]?.find((option) => option.value === value)

  pending.push(fromOption(find("route", config.route ?? "new"), "route"))
  pending.push(fromOption(find("finish", config.finish), "finish", `${find("finish", config.finish)?.label ?? ""} finish`))
  pending.push(fromOption(find("trim", config.trim), "trim"))
  if (!config.aero) pending.push(fromOption(find("spoiler", config.spoiler), "spoiler"))

  for (const region of regions) {
    const treatment = getTreatment(config, region.key)
    if (!treatment) continue
    if (treatment.kind === "colour") {
      pending.push(fromOption(find("base", treatment.value), `region-${region.key}`, `${region.label}: ${find("base", treatment.value)?.label ?? treatment.value}`))
    } else if (treatment.kind === "metallic" || treatment.kind === "chrome") {
      const material = find("material", treatment.kind)
      pending.push(fromOption(material, `region-${region.key}`, `${region.label}: ${material?.label ?? treatment.kind}`))
    }
    // Films always carry a price, so there's nothing to check for them.
  }

  const aero = extras.aeroKits?.find((kit) => kit.id === config.aero)
  if (aero && aero.price === null) pending.push({ key: "aero", label: aero.name })

  const visor = extras.visors?.find((item) => item.id === config.visor)
  if (visor && visor.price === null) pending.push({ key: "visor", label: `${visor.name} visor` })

  if (config.visorStrip?.enabled) {
    pending.push(fromOption(find("visor_strip", "printed"), "visorStrip", "Visor strip"))
  }

  for (const item of config.personalisation ?? []) {
    if (item.value.trim() === "") continue
    pending.push(fromOption(find("personalisation", item.kind), `personalisation-${item.kind}`))
  }

  // One entry per thing, even if it was chosen in two places.
  const seen = new Set<string>()
  return pending.filter((entry): entry is PendingPrice => {
    if (!entry || seen.has(entry.key)) return false
    seen.add(entry.key)
    return true
  })
}
