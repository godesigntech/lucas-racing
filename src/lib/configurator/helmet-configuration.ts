import { bellParts, hasCustomBellParts } from "@/lib/helmet-3d/parts"
import { colourDistance } from "@/lib/design-assistant/colour"
import { first3dModel } from "@/lib/helmet-3d/models"
import type { ConfiguratorOption, Film, PriceBook } from "@/types/catalog"
import type {
  ConfigSummaryLine,
  FinishId,
  HelmetConfiguration,
  PartId,
  PartKind,
  Placement,
  PriceBreakdown,
  PriceLine,
} from "@/types/configurator"
import type { HelmetLook } from "@/types/helmet"
import type { CatalogProduct } from "@/types/product"

// The helmet builder's rules. Pricing and the summary mirror public.place_order(),
// which re-checks and re-prices every build at checkout.

const DEFAULT_SIZE = "M"
const CHROME_SWATCH = "#c9ccd1"

export const partLabels: Record<PartId, string> = { base: "Shell", graphic: "Graphic", accent: "Pinstripe" }
export const partHints: Record<PartId, string> = {
  base: "The main colour of the helmet.",
  graphic: "The stripes or shapes of your template.",
  accent: "The thin line that outlines the graphic.",
}

export const finishLabels: Record<FinishId, string> = { gloss: "Gloss", satin: "Satin", matte: "Matte" }

export const placementLabels: Record<Placement, string> = {
  sides: "Both sides",
  left: "Left side",
  right: "Right side",
  front: "Front",
  back: "Back",
  top: "Top",
}
export const namePlacements: Placement[] = ["sides", "back", "front"]
export const numberPlacements: Placement[] = ["sides", "front", "back", "top"]
export const logoPlacements: Placement[] = ["back", "top", "left", "right", "front"]

/** Parts a template has: every design has a shell and pinstripe; plain ones have no graphic. */
export function templateParts(product: CatalogProduct): PartId[] {
  return product.look.layout === "blank" ? ["base", "accent"] : ["base", "graphic", "accent"]
}

export function partOf(config: HelmetConfiguration, part: PartId): { kind: PartKind; value: string } | null {
  if (part === "base") return { kind: config.baseKind, value: config.base }
  const kind = config[`${part}Kind`]
  const value = config[part]
  return kind && value !== undefined ? { kind, value } : null
}

/** Films customers can pick for a part: in-stock films with a photo. */
export function pickableFilms(priceBook: PriceBook): Film[] {
  return priceBook.films.filter((film) => film.textureUrl)
}

function activeOptions(priceBook: PriceBook, group: keyof PriceBook["options"]): ConfiguratorOption[] {
  return priceBook.options[group].filter((option) => option.isActive)
}

function nearestSwatch(options: ConfiguratorOption[], colour: string): string {
  return (
    [...options]
      .filter((option) => option.swatch)
      .sort((a, b) => colourDistance(a.swatch!, colour) - colourDistance(b.swatch!, colour))[0]?.value ??
    options[0]?.value ??
    colour
  )
}

/** Starting build for a template: its showcase colours, on a helmet we can show in 3D where possible. */
export function getInitialConfiguration(product: CatalogProduct, priceBook: PriceBook): HelmetConfiguration {
  const modelId = first3dModel(product.models)?.id ?? product.models[0] ?? ""
  const model = priceBook.models.find((item) => item.id === modelId)
  const palette = activeOptions(priceBook, "base")
  const { look } = product
  const film = look.film !== "none" ? pickableFilms(priceBook).find((item) => item.pattern === look.film) : undefined
  const chrome = look.finish === "chrome" && activeOptions(priceBook, "material").some((option) => option.value === "chrome")
  const finishes = activeOptions(priceBook, "finish").map((option) => option.value)

  const config: HelmetConfiguration = {
    model: modelId,
    size: model?.sizes.includes(DEFAULT_SIZE) ? DEFAULT_SIZE : (model?.sizes[0] ?? DEFAULT_SIZE),
    template: product.slug,
    finish: (finishes.includes(look.finish) ? look.finish : (finishes[0] ?? "gloss")) as FinishId,
    baseKind: chrome ? "chrome" : "colour",
    base: chrome ? "chrome" : nearestSwatch(palette, look.base),
    accentKind: "colour",
    accent: nearestSwatch(palette, look.accent),
    trim: nearestSwatch(activeOptions(priceBook, "trim"), look.trim),
    spoiler: look.spoiler ? "yes" : "no",
    namePosition: "sides",
    numberPosition: "sides",
    logoPosition: "back",
  }
  if (templateParts(product).includes("graphic")) {
    config.graphicKind = film ? "film" : "colour"
    config.graphic = film ? film.id : nearestSwatch(palette, look.graphic)
  }
  return config
}

/** Builds saved before the part-based builder had one film (on the graphic) and chrome as a finish. */
type LegacyConfiguration = Omit<Partial<HelmetConfiguration>, "finish"> & { film?: string; route?: string; finish?: string }

function validPart(part: PartId, kind: unknown, value: unknown, priceBook: PriceBook): { kind: PartKind; value: string } | null {
  if (kind === "colour" && typeof value === "string" && activeOptions(priceBook, "base").some((option) => option.value === value)) {
    return { kind, value }
  }
  if (kind === "film" && typeof value === "string" && pickableFilms(priceBook).some((film) => film.id === value)) {
    return { kind, value }
  }
  if (kind === "chrome" && part === "base" && activeOptions(priceBook, "material").some((option) => option.value === "chrome")) {
    return { kind, value: "chrome" }
  }
  return null
}

function validPlacement(value: unknown, allowed: Placement[], fallback: Placement): Placement {
  return allowed.includes(value as Placement) ? (value as Placement) : fallback
}

/**
 * Makes any build (a share link, a saved design, an older basket line, a model
 * change) valid for its template, filling gaps from the template's defaults.
 */
export function normaliseConfiguration(
  raw: Partial<HelmetConfiguration> | Record<string, unknown>,
  product: CatalogProduct,
  priceBook: PriceBook,
): HelmetConfiguration {
  const input = raw as LegacyConfiguration
  const defaults = getInitialConfiguration(product, priceBook)
  const config: HelmetConfiguration = { ...defaults, template: product.slug }

  if (typeof input.model === "string" && product.models.includes(input.model) && priceBook.models.some((item) => item.id === input.model)) {
    config.model = input.model
  }
  const sizes = priceBook.models.find((item) => item.id === config.model)?.sizes ?? []
  if (typeof input.size === "string" && sizes.includes(input.size)) config.size = input.size
  else if (!sizes.includes(config.size)) config.size = sizes[0] ?? config.size

  const finishes = activeOptions(priceBook, "finish").map((option) => option.value)
  if (typeof input.finish === "string" && finishes.includes(input.finish)) config.finish = input.finish as FinishId

  // Older builds: chrome was a finish, and a single film went on the graphic.
  const legacyChrome = input.finish === "chrome" && !input.baseKind
  const base = validPart("base", legacyChrome ? "chrome" : (input.baseKind ?? (input.base ? "colour" : undefined)), input.base, priceBook)
  if (base) {
    config.baseKind = base.kind
    config.base = base.value
  }

  for (const part of ["graphic", "accent"] as const) {
    if (!templateParts(product).includes(part)) {
      delete config[part]
      delete config[`${part}Kind`]
      continue
    }
    const legacyFilm = part === "graphic" && !input.graphicKind && input.film && input.film !== "none" ? input.film : undefined
    const valid = validPart(part, legacyFilm ? "film" : input[`${part}Kind`], legacyFilm ?? input[part], priceBook)
    if (valid) {
      config[`${part}Kind`] = valid.kind
      config[part] = valid.value
    }
  }

  if (typeof input.trim === "string" && activeOptions(priceBook, "trim").some((option) => option.value === input.trim)) config.trim = input.trim
  if (input.spoiler === "yes" || input.spoiler === "no") config.spoiler = input.spoiler

  if (config.model === "bell-kc7") {
    for (const { key } of bellParts) {
      const colour = input[key]
      if (typeof colour === "string" && /^#[0-9a-f]{6}$/i.test(colour)) config[key] = colour.toLowerCase()
    }
  }

  const riderName = typeof input.riderName === "string" ? input.riderName.slice(0, 24) : ""
  const raceNumber = typeof input.raceNumber === "string" ? input.raceNumber.replace(/[^0-9a-z]/gi, "").slice(0, 3).toUpperCase() : ""
  if (riderName) config.riderName = riderName
  if (raceNumber) config.raceNumber = raceNumber
  if (typeof input.logo === "string" && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(input.logo)) config.logo = input.logo
  config.namePosition = validPlacement(input.namePosition, namePlacements, "sides")
  config.numberPosition = validPlacement(input.numberPosition, numberPlacements, "sides")
  config.logoPosition = validPlacement(input.logoPosition, logoPlacements, "back")
  return config
}

function colourOption(priceBook: PriceBook, value: string) {
  return priceBook.options.base.find((option) => option.value === value)
}

function partLabel(priceBook: PriceBook, paint: { kind: PartKind; value: string }): string {
  if (paint.kind === "chrome") return priceBook.options.material.find((option) => option.value === "chrome")?.label ?? "Chrome"
  if (paint.kind === "film") return `Film ${priceBook.films.find((film) => film.id === paint.value)?.name ?? paint.value}`
  return colourOption(priceBook, paint.value)?.label ?? paint.value
}

function partSwatch(priceBook: PriceBook, paint: { kind: PartKind; value: string }): { colour: string; texture?: string } {
  if (paint.kind === "chrome") return { colour: CHROME_SWATCH }
  if (paint.kind === "film") {
    const film = priceBook.films.find((item) => item.id === paint.value)
    return { colour: "#8a8d8b", texture: film?.textureUrl ?? undefined }
  }
  return { colour: colourOption(priceBook, paint.value)?.swatch ?? paint.value }
}

/** What the customer sees for each part: label plus the swatch colour or film photo. */
export function describePart(priceBook: PriceBook, config: HelmetConfiguration, part: PartId) {
  const paint = partOf(config, part)
  return paint ? { label: partLabel(priceBook, paint), ...partSwatch(priceBook, paint), kind: paint.kind } : null
}

/** The build drawn as the helmet illustration and the 3D shell. */
export function configurationToLook(product: CatalogProduct, config: HelmetConfiguration, priceBook: PriceBook): HelmetLook {
  const base = partSwatch(priceBook, { kind: config.baseKind, value: config.base })
  const graphicPaint = partOf(config, "graphic")
  const accentPaint = partOf(config, "accent")
  const graphic = graphicPaint ? partSwatch(priceBook, graphicPaint) : null
  const accent = accentPaint ? partSwatch(priceBook, accentPaint) : null
  const graphicFilm = graphicPaint?.kind === "film" ? priceBook.films.find((film) => film.id === graphicPaint.value) : undefined

  return {
    ...product.look,
    finish: config.baseKind === "chrome" ? "chrome" : config.finish,
    paintFinish: config.finish,
    base: base.colour,
    baseTexture: base.texture,
    graphic: graphic?.colour ?? product.look.graphic,
    filmTexture: graphic?.texture,
    film: graphicFilm?.pattern ?? "none",
    accent: accent?.colour ?? product.look.accent,
    accentTexture: accent?.texture,
    trim: config.trim,
    accessories: config.model === "bell-kc7" ? Object.fromEntries(bellParts.map(({ key }) => [key, config[key]])) : undefined,
    spoiler: config.spoiler === "yes",
    number: config.raceNumber?.trim() || undefined,
    name: config.riderName?.trim() || undefined,
  }
}

/**
 * Price of one helmet. Mirrors public.place_order(), the source of truth at checkout.
 * Null for designs priced on request.
 */
export function calculateHelmetPrice(product: CatalogProduct, config: HelmetConfiguration, priceBook: PriceBook): PriceBreakdown | null {
  if (product.startingPrice === null || hasCustomBellParts(config)) return null
  const lines: PriceLine[] = [{ label: `${product.name} design`, amount: product.startingPrice }]

  const model = priceBook.models.find((item) => item.id === config.model)
  if (model) lines.push({ label: `New ${model.name}`, amount: model.newHelmetPrice })

  for (const part of templateParts(product)) {
    const paint = partOf(config, part)
    if (!paint) continue
    if (paint.kind === "film") {
      const film = priceBook.films.find((item) => item.id === paint.value)
      if (film?.price) lines.push({ label: `${partLabels[part]}: ${film.name}`, amount: film.price })
    } else if (paint.kind === "chrome") {
      const chrome = priceBook.options.material.find((option) => option.value === "chrome")
      if (chrome?.price) lines.push({ label: `${partLabels[part]}: chrome`, amount: chrome.price })
    } else {
      const colour = colourOption(priceBook, paint.value)
      if (colour?.price) lines.push({ label: `${partLabels[part]}: ${colour.label}`, amount: colour.price })
    }
  }

  const finish = priceBook.options.finish.find((item) => item.value === config.finish)
  if (finish?.price) lines.push({ label: `${finish.label} finish`, amount: finish.price })
  const trim = priceBook.options.trim.find((item) => item.value === config.trim)
  if (trim?.price) lines.push({ label: `${trim.label} rubber trim`, amount: trim.price })
  const spoiler = priceBook.options.spoiler.find((item) => item.value === config.spoiler)
  if (spoiler?.price) lines.push({ label: "Rear spoiler", amount: spoiler.price })

  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0) }
}

/** Plain-language summary of a build, matching the order summary saved at checkout. */
export function summariseConfiguration(product: CatalogProduct, config: HelmetConfiguration, priceBook: PriceBook): ConfigSummaryLine[] {
  const model = priceBook.models.find((item) => item.id === config.model)
  const lines: ConfigSummaryLine[] = [
    { key: "model", label: "Helmet", value: model ? `${model.name} (new)` : config.model },
    { key: "size", label: "Helmet size", value: config.size },
    { key: "template", label: "Template", value: product.name },
  ]
  for (const part of templateParts(product)) {
    const paint = partOf(config, part)
    if (paint) lines.push({ key: part, label: partLabels[part], value: partLabel(priceBook, paint) })
  }
  const option = (group: "finish" | "trim" | "spoiler") =>
    priceBook.options[group].find((item) => item.value === config[group])?.label ?? config[group]
  lines.push(
    { key: "finish", label: "Finish", value: option("finish") },
    { key: "trim", label: config.eyeportTrim || config.baseTrim ? "Default trim colour" : "Rubber trim", value: option("trim") },
    { key: "spoiler", label: "Rear spoiler", value: option("spoiler") },
  )
  if (config.model === "bell-kc7") {
    for (const { key, label } of bellParts) {
      const colour = config[key]
      if (colour) lines.push({ key, label, value: `${colourOption(priceBook, colour)?.label ?? colour.toUpperCase()} · quoted separately` })
    }
  }
  if (config.riderName?.trim()) {
    lines.push({ key: "riderName", label: "Name on helmet", value: `${config.riderName.trim()} · ${placementLabels[config.namePosition ?? "sides"]}` })
  }
  if (config.raceNumber?.trim()) {
    lines.push({ key: "raceNumber", label: "Race number", value: `${config.raceNumber.trim()} · ${placementLabels[config.numberPosition ?? "sides"]}` })
  }
  if (config.logo) lines.push({ key: "logo", label: "Logo", value: `Uploaded · ${placementLabels[config.logoPosition ?? "back"]}` })
  return lines
}

/** Plain-text summary used to pre-fill the enquiry form. */
export function configurationToText(product: CatalogProduct, summary: ConfigSummaryLine[]): string {
  return [`Design: ${product.name}`, ...summary.map((line) => `${line.label}: ${line.value}`)].join("\n")
}

/** Share link parameters for a build. The logo is private, so it isn't shared. */
export function configToSearchParams(config: HelmetConfiguration): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(config)) {
    if (key !== "logo" && typeof value === "string" && value) params.set(key, value)
  }
  return params
}
