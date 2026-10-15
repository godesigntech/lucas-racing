import { first3dModel } from "@/lib/helmet-3d/models"
import type { PriceBook } from "@/types/catalog"
import type {
  ConfigKey,
  ConfigOptionGroup,
  ConfigSummaryLine,
  HelmetConfiguration,
} from "@/types/configurator"
import type { HelmetFinish, HelmetLook } from "@/types/helmet"
import type { CatalogProduct } from "@/types/product"

const DEFAULT_SIZE = "M"

const groupMeta = {
  route: { label: "How you'd like it", kind: "choice" },
  finish: { label: "Base finish", kind: "choice" },
  base: { label: "Base colour", kind: "swatch" },
  trim: { label: "Rubber trim", kind: "swatch" },
  spoiler: { label: "Rear spoiler", kind: "choice" },
} as const

function optionGroup(key: keyof typeof groupMeta, priceBook: PriceBook): ConfigOptionGroup {
  return {
    key,
    ...groupMeta[key],
    choices: priceBook.options[key].map((option) => ({
      value: option.value,
      label: option.label,
      hint: option.hint ?? undefined,
      swatch: option.swatch ?? undefined,
      price: option.price,
    })),
  }
}

/** Option groups for a product, in display order, built from live catalogue data. */
export function getOptionGroups(
  product: CatalogProduct,
  priceBook: PriceBook,
  config?: HelmetConfiguration,
): ConfigOptionGroup[] {
  const models = priceBook.models.filter((model) => product.models.includes(model.id))
  const selectedModel = models.find((model) => model.id === config?.model) ?? models[0]

  return [
    {
      key: "model",
      label: "Helmet",
      kind: "choice",
      choices: models.map((model) => ({ value: model.id, label: model.name })),
    },
    optionGroup("route", priceBook),
    {
      key: "size",
      label: "Helmet size",
      kind: "choice",
      choices: (selectedModel?.sizes ?? []).map((size) => ({ value: size, label: size })),
    },
    optionGroup("finish", priceBook),
    optionGroup("base", priceBook),
    {
      key: "film",
      label: "Hydro-dip film on the graphic",
      kind: "choice",
      description: "Films sample the Hydro Karts library. The full range arrives with the 3D builder.",
      choices: priceBook.films.map((film) => ({ value: film.id, label: film.name, price: film.price })),
    },
    optionGroup("trim", priceBook),
    optionGroup("spoiler", priceBook),
  ]
}

function pick(values: string[], preferred: string | undefined): string {
  return preferred && values.includes(preferred) ? preferred : (values[0] ?? "")
}

/**
 * Starting configuration taken from the product's showcase colourway. Starts on a
 * helmet we can show in 3D when the design offers one.
 */
export function getInitialConfiguration(product: CatalogProduct, priceBook: PriceBook): HelmetConfiguration {
  const modelId = first3dModel(product.models)?.id ?? product.models[0] ?? ""
  const model = priceBook.models.find((item) => item.id === modelId)
  const values = (group: keyof PriceBook["options"]) => priceBook.options[group].map((option) => option.value)
  const filmForLook = priceBook.films.find((film) => film.pattern === product.look.film)

  return {
    model: modelId,
    route: pick(values("route"), "new"),
    size: pick(model?.sizes ?? [], DEFAULT_SIZE),
    finish: pick(values("finish"), product.look.finish),
    base: pick(values("base"), product.look.base),
    film: pick(
      priceBook.films.map((film) => film.id),
      filmForLook?.id,
    ),
    trim: pick(values("trim"), product.look.trim),
    spoiler: pick(values("spoiler"), product.look.spoiler ? "yes" : "no"),
  }
}

/** Keeps a configuration valid after a change (e.g. size list differs between helmets). */
export function normaliseConfiguration(
  config: HelmetConfiguration,
  product: CatalogProduct,
  priceBook: PriceBook,
): HelmetConfiguration {
  const model = priceBook.models.find((item) => item.id === config.model)
  return model && !model.sizes.includes(config.size) ? { ...config, size: pick(model.sizes, DEFAULT_SIZE) } : config
}

/** Groups that don't apply to the current configuration, with the reason shown to the user. */
export function getDisabledGroups(config: HelmetConfiguration): Partial<Record<ConfigKey, string>> {
  return config.finish === "chrome" ? { base: "Chrome replaces the base colour." } : {}
}

/** Maps the configuration onto the illustration, keeping the design's own graphic colours. */
export function configurationToLook(
  product: CatalogProduct,
  config: HelmetConfiguration,
  priceBook: PriceBook,
): HelmetLook {
  const film = priceBook.films.find((item) => item.id === config.film)
  return {
    ...product.look,
    finish: config.finish as HelmetFinish,
    base: config.finish === "chrome" ? "#c9ccd1" : config.base,
    film: film?.pattern ?? "none",
    filmTexture: film?.textureUrl ?? undefined,
    // The customer's own name and number replace the design's sample ones on the illustration.
    number: config.raceNumber?.trim() || product.look.number,
    name: config.riderName?.trim() || product.look.name,
    trim: config.trim,
    spoiler: config.spoiler === "yes",
  }
}

export function summariseConfiguration(
  groups: ConfigOptionGroup[],
  config: HelmetConfiguration,
): ConfigSummaryLine[] {
  const disabled = getDisabledGroups(config)
  const lines: ConfigSummaryLine[] = groups.map((group) => {
    const choice = group.choices.find((item) => item.value === config[group.key])
    return {
      key: group.key,
      label: group.label,
      value: disabled[group.key] ? "Chrome" : (choice?.label ?? config[group.key]),
    }
  })
  if (config.riderName?.trim()) lines.push({ key: "riderName", label: "Name on helmet", value: config.riderName.trim() })
  if (config.raceNumber?.trim()) lines.push({ key: "raceNumber", label: "Race number", value: config.raceNumber.trim() })
  if (config.logo) lines.push({ key: "logo", label: "Logo", value: "Uploaded" })
  return lines
}

/** Plain-text summary used to pre-fill the enquiry form. */
export function configurationToText(product: CatalogProduct, summary: ConfigSummaryLine[]): string {
  const lines = summary.map((line) => `${line.label}: ${line.value}`)
  return [`Design: ${product.name}`, ...lines].join("\n")
}
