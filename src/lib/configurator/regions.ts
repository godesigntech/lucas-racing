import { getTemplateArtwork } from "@/lib/helmet-3d/templates"
import type { HelmetConfiguration, PartId, PartKind, RegionTreatment } from "@/types/configurator"
import type { CatalogProduct } from "@/types/product"
import type { DesignTemplate, RegionKind } from "@/types/templates"

/**
 * Editable areas of a template.
 *
 * A template's regions come from the database (design_templates / template_regions), so
 * the workshop can add designs without a deploy. Until that data exists for a design we
 * fall back to the three areas the builder has always had, which keeps every existing
 * template working and means this module can be used everywhere from day one.
 *
 * The three legacy keys are also mirrored into the flat `baseKind`/`base`,
 * `graphicKind`/`graphic`, `accentKind`/`accent` fields, because share links, the
 * illustrated preview and the original place_order() path all still read them.
 */

/** Region keys that are also stored as flat fields on the build. */
export const legacyRegionKeys: PartId[] = ["base", "graphic", "accent"]

const legacyLabels: Record<PartId, string> = { base: "Shell", graphic: "Graphic", accent: "Pinstripe" }
const legacyHints: Record<PartId, string> = {
  base: "The main colour of the helmet.",
  graphic: "The stripes or shapes of your template.",
  accent: "The thin line that outlines the graphic.",
}

export interface BuilderRegion {
  key: string
  label: string
  hint: string
  kind: RegionKind
  /** Greyscale mask in UV space. Null for the shell, which is everything else. */
  maskUrl: string | null
  svgElementId: string | null
  defaultColour: string
  allowsFilm: boolean
  allowsChrome: boolean
  allowsMetallic: boolean
}

function isLegacyKey(key: string): key is PartId {
  return (legacyRegionKeys as string[]).includes(key)
}

/** The regions of the template the customer is building on. */
export function resolveRegions(
  product: CatalogProduct,
  modelId: string,
  templates: DesignTemplate[] = [],
): BuilderRegion[] {
  const template = templates.find((item) => item.productSlug === product.slug && item.modelId === modelId)
  if (template && template.regions.length > 0) {
    return template.regions.map((region) => ({
      key: region.key,
      label: region.label,
      hint: isLegacyKey(region.key) ? legacyHints[region.key] : "",
      kind: region.kind,
      maskUrl: region.maskUrl,
      svgElementId: region.svgElementId,
      defaultColour: region.defaultColour,
      allowsFilm: region.allowsFilm,
      allowsChrome: region.allowsChrome,
      allowsMetallic: region.allowsMetallic,
    }))
  }

  // No template rows yet: the shell, the template's graphic (plain designs have none)
  // and the pinstripe, exactly as the builder has always offered them. The masks come
  // from the artwork already shipped in /public, so the 3D preview doesn't regress while
  // the database catches up.
  const artwork = getTemplateArtwork(modelId, product.slug)
  const legacyMasks: Record<PartId, string | null> = {
    base: null,
    graphic: artwork?.graphicMask ?? null,
    accent: artwork?.accentMask ?? null,
  }
  const keys: PartId[] = product.look.layout === "blank" ? ["base", "accent"] : ["base", "graphic", "accent"]
  return keys.map((key) => ({
    key,
    label: legacyLabels[key],
    hint: legacyHints[key],
    kind: key === "accent" ? ("pinstripe" as const) : ("fill" as const),
    maskUrl: legacyMasks[key],
    svgElementId: null,
    defaultColour: key === "base" ? product.look.base : key === "graphic" ? product.look.graphic : product.look.accent,
    allowsFilm: true,
    // Chrome has always been shell-only, because that's what the shader supports.
    allowsChrome: key === "base",
    allowsMetallic: true,
  }))
}

/** Regions the customer paints in step 4; pinstripes get their own step. */
export const fillRegions = (regions: BuilderRegion[]) => regions.filter((region) => region.kind !== "pinstripe")
export const pinstripeRegions = (regions: BuilderRegion[]) => regions.filter((region) => region.kind === "pinstripe")

/** What a region is currently painted with, reading the flat fields for the legacy three. */
export function getTreatment(config: HelmetConfiguration, key: string): RegionTreatment | null {
  const stored = config.regions?.[key]
  if (stored) return stored
  if (!isLegacyKey(key)) return null
  if (key === "base") return { kind: config.baseKind, value: config.base }
  const kind = config[`${key}Kind`]
  const value = config[key]
  return kind && value !== undefined ? { kind, value } : null
}

/**
 * The change to apply for a new treatment. Writes the nested region and, for the three
 * legacy keys, the flat fields too, so one build is readable by both the old and the
 * new code paths.
 */
export function setTreatment(
  config: HelmetConfiguration,
  key: string,
  treatment: RegionTreatment,
): Partial<HelmetConfiguration> {
  const changes: Partial<HelmetConfiguration> = {
    v: "2",
    regions: { ...config.regions, [key]: treatment },
  }
  if (key === "base") {
    changes.baseKind = treatment.kind
    changes.base = treatment.value
  } else if (key === "graphic" || key === "accent") {
    changes[`${key}Kind`] = treatment.kind
    changes[key] = treatment.value
  }
  return changes
}

/** True when any region uses a material that can only be lacquered gloss. */
export function requiresGloss(config: HelmetConfiguration, regions: BuilderRegion[]): boolean {
  return regions.some((region) => {
    const treatment = getTreatment(config, region.key)
    return treatment?.kind === "chrome" || treatment?.kind === "metallic"
  })
}

/** The materials a region will accept, in the order the builder shows them. */
export function allowedKinds(region: BuilderRegion): PartKind[] {
  const kinds: PartKind[] = ["colour"]
  if (region.allowsFilm) kinds.push("film")
  if (region.allowsMetallic) kinds.push("metallic")
  if (region.allowsChrome) kinds.push("chrome")
  return kinds
}
