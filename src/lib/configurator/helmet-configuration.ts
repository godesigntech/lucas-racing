import { bellParts, hasCustomBellParts } from "@/lib/helmet-3d/parts"
import { colourDistance } from "@/lib/design-assistant/colour"
import { getTreatment } from "@/lib/configurator/regions"
import { first3dModel } from "@/lib/helmet-3d/models"
import type { AeroKit, Visor } from "@/types/templates"
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

/**
 * The builder's catalogue beyond the price book. Passed in rather than fetched, so the
 * pricing mirror and the summary stay pure and match what the customer is looking at.
 */
export interface BuilderExtras {
  regions?: { key: string; label: string }[]
  aeroKits?: AeroKit[]
  visors?: Visor[]
}

/** Regions to price: the template's own when we know them, else the original three. */
function priceableRegions(product: CatalogProduct, extras: BuilderExtras): { key: string; label: string }[] {
  if (extras.regions?.length) return extras.regions
  return templateParts(product).map((part) => ({ key: part, label: partLabels[part] }))
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
  if (typeof input.logo === "string" && LOGO_PATH.test(input.logo)) config.logo = input.logo
  config.namePosition = validPlacement(input.namePosition, namePlacements, "sides")
  config.numberPosition = validPlacement(input.numberPosition, numberPlacements, "sides")
  config.logoPosition = validPlacement(input.logoPosition, logoPlacements, "back")
  return carryV2Fields(config, raw as Partial<HelmetConfiguration>, priceBook)
}

const LOGO_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/
const PART_KINDS: PartKind[] = ["colour", "film", "chrome", "metallic"]

/**
 * The fields the 16-step builder added. They're checked for shape here; what can
 * actually be sold is settled by public.place_order(), which re-reads every price.
 *
 * Anything unrecognised is dropped rather than carried, so a hand-edited share link
 * can't smuggle values into the basket.
 */
function carryV2Fields(
  config: HelmetConfiguration,
  input: Partial<HelmetConfiguration>,
  priceBook: PriceBook,
): HelmetConfiguration {
  if (input.route === "own" && activeOptions(priceBook, "route").some((option) => option.value === "own")) {
    config.route = "own"
  } else if (input.route === "new" || input.route === "own") {
    config.route = "new"
  }

  if (typeof input.aero === "string" && input.aero) config.aero = input.aero.slice(0, 60)
  if (typeof input.visor === "string" && input.visor) config.visor = input.visor.slice(0, 60)

  const strip = input.visorStrip
  if (strip && typeof strip === "object" && typeof strip.text === "string") {
    config.visorStrip = {
      enabled: Boolean(strip.enabled),
      colour: isHex(strip.colour) ? strip.colour : "#101114",
      text: strip.text.slice(0, 40),
      textColour: isHex(strip.textColour) ? strip.textColour : "#ffffff",
      font: typeof strip.font === "string" ? strip.font.slice(0, 20) : "racing",
    }
  }

  if (input.regions && typeof input.regions === "object") {
    const regions: NonNullable<HelmetConfiguration["regions"]> = {}
    for (const [key, treatment] of Object.entries(input.regions)) {
      if (!treatment || typeof treatment !== "object") continue
      if (!PART_KINDS.includes(treatment.kind) || typeof treatment.value !== "string") continue
      regions[key.slice(0, 40)] = { kind: treatment.kind, value: treatment.value.slice(0, 80) }
    }
    if (Object.keys(regions).length > 0) config.regions = regions
  }

  if (Array.isArray(input.personalisation)) {
    const items = input.personalisation
      .filter((item) => item && typeof item.value === "string" && typeof item.kind === "string")
      .slice(0, 6)
      .map((item) => ({
        ...item,
        value: item.value.slice(0, 24),
        position: validPlacement(item.position, item.kind === "number" ? numberPlacements : namePlacements, "sides"),
      }))
    if (items.length > 0) config.personalisation = items
  }

  if (Array.isArray(input.logos)) {
    const logos = input.logos
      .filter((logo) => logo && typeof logo.path === "string" && LOGO_PATH.test(logo.path))
      .slice(0, 4)
      .map((logo) => ({ ...logo, position: validPlacement(logo.position, logoPlacements, "back") }))
    if (logos.length > 0) config.logos = logos
  }

  // Mark the build as the new format once it carries anything only that format has.
  if (config.regions || config.personalisation || config.logos || config.visorStrip || config.aero || config.visor || config.route) {
    config.v = "2"
  }
  return config
}

const isHex = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)

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
export function calculateHelmetPrice(
  product: CatalogProduct,
  config: HelmetConfiguration,
  priceBook: PriceBook,
  extras: BuilderExtras = {},
): PriceBreakdown | null {
  if (product.startingPrice === null || hasCustomBellParts(config)) return null
  const lines: PriceLine[] = [{ label: `${product.name} design`, amount: product.startingPrice }]

  // Only charge for a helmet when we're the ones supplying it.
  const model = priceBook.models.find((item) => item.id === config.model)
  if (model && (config.route ?? "new") === "new") lines.push({ label: `New ${model.name}`, amount: model.newHelmetPrice })

  for (const { key, label } of priceableRegions(product, extras)) {
    const paint = getTreatment(config, key)
    if (!paint) continue
    if (paint.kind === "film") {
      const film = priceBook.films.find((item) => item.id === paint.value)
      if (film?.price) lines.push({ label: `${label}: ${film.name}`, amount: film.price })
    } else if (paint.kind === "chrome" || paint.kind === "metallic") {
      const material = priceBook.options.material.find((option) => option.value === paint.kind)
      if (material?.price) lines.push({ label: `${label}: ${material.label.toLowerCase()}`, amount: material.price })
    } else {
      const colour = colourOption(priceBook, paint.value)
      if (colour?.price) lines.push({ label: `${label}: ${colour.label}`, amount: colour.price })
    }
  }

  const finish = priceBook.options.finish.find((item) => item.value === config.finish)
  if (finish?.price) lines.push({ label: `${finish.label} finish`, amount: finish.price })
  const trim = priceBook.options.trim.find((item) => item.value === config.trim)
  if (trim?.price) lines.push({ label: `${trim.label} rubber trim`, amount: trim.price })

  const aero = extras.aeroKits?.find((kit) => kit.id === config.aero)
  if (aero) {
    if (aero.price) lines.push({ label: aero.name, amount: aero.price })
  } else {
    const spoiler = priceBook.options.spoiler.find((item) => item.value === config.spoiler)
    if (spoiler?.price) lines.push({ label: "Rear spoiler", amount: spoiler.price })
  }

  const visor = extras.visors?.find((item) => item.id === config.visor)
  if (visor?.price) lines.push({ label: `${visor.name} visor`, amount: visor.price })

  if (config.visorStrip?.enabled) {
    const strip = priceBook.options.visor_strip?.find((item) => item.value === "printed")
    if (strip?.price) lines.push({ label: "Visor strip", amount: strip.price })
  }

  for (const item of config.personalisation ?? []) {
    if (!item.value.trim()) continue
    const option = priceBook.options.personalisation?.find((entry) => entry.value === item.kind)
    if (option?.price) lines.push({ label: option.label, amount: option.price })
  }

  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0) }
}

/** Plain-language summary of a build, matching the order summary saved at checkout. */
export function summariseConfiguration(
  product: CatalogProduct,
  config: HelmetConfiguration,
  priceBook: PriceBook,
  extras: BuilderExtras = {},
): ConfigSummaryLine[] {
  const model = priceBook.models.find((item) => item.id === config.model)
  const supply = (config.route ?? "new") === "own" ? "your own shell" : "new"
  const lines: ConfigSummaryLine[] = [
    { key: "model", label: "Helmet", value: model ? `${model.name} (${supply})` : config.model },
    { key: "size", label: "Helmet size", value: config.size },
    { key: "template", label: "Template", value: product.name },
  ]
  for (const { key, label } of priceableRegions(product, extras)) {
    const paint = getTreatment(config, key)
    if (paint) lines.push({ key, label, value: partLabel(priceBook, paint) })
  }
  const option = (group: "finish" | "trim" | "spoiler") =>
    priceBook.options[group].find((item) => item.value === config[group])?.label ?? config[group]
  lines.push(
    { key: "finish", label: "Finish", value: option("finish") },
    { key: "trim", label: config.eyeportTrim || config.baseTrim ? "Default trim colour" : "Rubber trim", value: option("trim") },
  )

  const aero = extras.aeroKits?.find((kit) => kit.id === config.aero)
  lines.push(aero ? { key: "aero", label: "Aero kit", value: aero.name } : { key: "spoiler", label: "Rear spoiler", value: option("spoiler") })

  const visor = extras.visors?.find((item) => item.id === config.visor)
  if (visor) lines.push({ key: "visor", label: "Visor", value: visor.name })

  if (config.visorStrip?.enabled) {
    lines.push({ key: "visorStrip", label: "Visor strip", value: config.visorStrip.text.trim() || "Plain" })
  }

  // Indexed keys: a build can carry several names or logos, and React needs them unique.
  ;(config.personalisation ?? []).forEach((item, index) => {
    if (!item.value.trim()) return
    const label = priceBook.options.personalisation?.find((entry) => entry.value === item.kind)?.label ?? item.kind
    lines.push({ key: `personalisation-${index}`, label, value: `${item.value.trim()} · ${placementLabels[item.position]}` })
  })

  ;(config.logos ?? []).forEach((logo, index) => {
    lines.push({ key: `logos-${index}`, label: "Logo", value: `Uploaded · ${placementLabels[logo.position]}` })
  })
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

/**
 * Share link parameters for a build. Logos are private, so they aren't shared.
 *
 * The flat fields stay as plain query parameters, which keeps every link shared before
 * the 16-step builder working. Anything that doesn't fit in a single string — regions,
 * personalisation, the visor strip — is packed into one `d` parameter.
 */
export function configToSearchParams(config: HelmetConfiguration): URLSearchParams {
  const params = new URLSearchParams()
  const nested: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(config)) {
    if (key === "logo" || key === "logos") continue
    if (typeof value === "string" && value) params.set(key, value)
    else if (value && typeof value === "object") nested[key] = value
  }
  if (Object.keys(nested).length > 0) {
    // base64url, so the link survives being pasted into a message or an email.
    const packed = btoa(JSON.stringify(nested)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    params.set("d", packed)
  }
  return params
}
