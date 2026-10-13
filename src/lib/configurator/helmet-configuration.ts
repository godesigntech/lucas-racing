import {
  baseColourOptions,
  filmOptions,
  finishOptions,
  routeOptions,
  sizeOptions,
  spoilerOptions,
  trimOptions,
} from "@/data/configurator-options"
import { getHelmetModels } from "@/lib/data/products"
import type {
  ConfigKey,
  ConfigOptionGroup,
  ConfigSummaryLine,
  HelmetConfiguration,
} from "@/types/configurator"
import type { FilmId, HelmetFinish, HelmetLook } from "@/types/helmet"
import type { Product } from "@/types/product"

/** Option groups for a product, in display order. */
export function getOptionGroups(product: Product): ConfigOptionGroup[] {
  const modelGroup: ConfigOptionGroup = {
    key: "model",
    label: "Helmet",
    kind: "choice",
    choices: getHelmetModels(product.models).map((model) => ({
      value: model.id,
      label: model.name,
    })),
  }

  return [
    modelGroup,
    routeOptions,
    sizeOptions,
    finishOptions,
    baseColourOptions,
    filmOptions,
    trimOptions,
    spoilerOptions,
  ]
}

function closestChoice(group: ConfigOptionGroup, preferred: string): string {
  return group.choices.some((choice) => choice.value === preferred) ? preferred : group.choices[0].value
}

/** Starting configuration taken from the product's showcase colourway. */
export function getInitialConfiguration(product: Product): HelmetConfiguration {
  return {
    model: product.models[0],
    route: "new",
    size: "M",
    finish: product.look.finish,
    base: closestChoice(baseColourOptions, product.look.base),
    film: product.look.film,
    trim: closestChoice(trimOptions, product.look.trim),
    spoiler: product.look.spoiler ? "yes" : "no",
  }
}

/** Groups that don't apply to the current configuration, with the reason shown to the user. */
export function getDisabledGroups(config: HelmetConfiguration): Partial<Record<ConfigKey, string>> {
  return config.finish === "chrome" ? { base: "Chrome replaces the base colour." } : {}
}

/** Maps the configuration onto the illustration, keeping the design's own graphic colours. */
export function configurationToLook(product: Product, config: HelmetConfiguration): HelmetLook {
  return {
    ...product.look,
    finish: config.finish as HelmetFinish,
    base: config.finish === "chrome" ? "#c9ccd1" : config.base,
    film: config.film as FilmId,
    trim: config.trim,
    spoiler: config.spoiler === "yes",
  }
}

export function summariseConfiguration(
  groups: ConfigOptionGroup[],
  config: HelmetConfiguration,
): ConfigSummaryLine[] {
  const disabled = getDisabledGroups(config)
  return groups.map((group) => {
    const choice = group.choices.find((item) => item.value === config[group.key])
    return {
      key: group.key,
      label: group.label,
      value: disabled[group.key] ? "Chrome" : (choice?.label ?? config[group.key]),
    }
  })
}

/** Plain-text summary used to pre-fill the enquiry form. */
export function configurationToText(product: Product, summary: ConfigSummaryLine[]): string {
  const lines = summary.map((line) => `${line.label}: ${line.value}`)
  return [`Design: ${product.name}`, ...lines].join("\n")
}
