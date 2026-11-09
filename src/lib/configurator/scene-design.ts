import type { SceneDesign, SceneRegion } from "@/components/helmet-3d/helmet-scene"
import type { BuilderRegion } from "@/lib/configurator/regions"
import { getTreatment } from "@/lib/configurator/regions"
import type { PriceBook } from "@/types/catalog"
import { holographicTapes } from "@/lib/configurator/helmet-configuration"
import type { FinishId, HelmetConfiguration, PartKind, RegionTreatment, VisorStrip } from "@/types/configurator"
import type { HelmetLook } from "@/types/helmet"

/**
 * Turns a build into the textures and materials the 3D preview needs.
 *
 * The shell is handled by the model's own material (colour, lacquer, whole-shell film);
 * everything else is a region painted over it, so this only describes the non-shell ones.
 */

/** Lacquer roughness, matching the shader's paint presets. */
const lacquerRoughness: Record<FinishId, number> = { gloss: 0.35, satin: 0.6, matte: 1 }

/** How shiny and metallic a part is. Over a chrome base coat, paint and film let the mirror show through. */
function materialFor(kind: PartKind, finish: FinishId, chromeBase = false): { metalness: number; roughness: number } {
  if (kind === "chrome") return { metalness: 1, roughness: 0.08 }
  if (kind === "metallic") return chromeBase ? { metalness: 0.95, roughness: 0.12 } : { metalness: 0.65, roughness: 0.28 }
  if (kind === "film") return chromeBase ? { metalness: 0.6, roughness: 0.2 } : { metalness: 0, roughness: 0.4 }
  return chromeBase ? { metalness: 0.85, roughness: 0.15 } : { metalness: 0, roughness: lacquerRoughness[finish] }
}

const CHROME_SWATCH = "#c9ccd1"
const METALLIC_SWATCH = "#b8bdc4"
/** Under a film with no colour chosen, the pattern shows as it is. */
const FILM_BASE = "#ffffff"

/** The colour the shader should paint a region, and the film photo to project over it. */
function appearance(
  priceBook: PriceBook,
  treatment: RegionTreatment,
  fallback: string,
  uploads: Record<string, string> = {},
): { colour: string; filmUrl: string | null } {
  const print = treatment.print ? uploads[treatment.print] : undefined
  if (treatment.kind === "film" && print) return { colour: FILM_BASE, filmUrl: print }
  if (treatment.kind === "chrome") return { colour: CHROME_SWATCH, filmUrl: null }
  if (treatment.kind === "metallic") {
    // Metallic keeps the chosen colour; the metalness in the shader does the rest.
    const swatch = priceBook.options.base.find((option) => option.value === treatment.value)?.swatch
    return { colour: swatch ?? (treatment.value.startsWith("#") ? treatment.value : METALLIC_SWATCH), filmUrl: null }
  }
  if (treatment.kind === "film") {
    const film = priceBook.films.find((item) => item.id === treatment.value)
    return { colour: treatment.under ?? FILM_BASE, filmUrl: film?.textureUrl ?? null }
  }
  const swatch = priceBook.options.base.find((option) => option.value === treatment.value)?.swatch
  return { colour: swatch ?? (treatment.value.startsWith("#") ? treatment.value : fallback), filmUrl: null }
}

export function buildSceneDesign(
  config: HelmetConfiguration,
  regions: BuilderRegion[],
  priceBook: PriceBook,
  logoUrls: Record<string, string> = {},
  /** The template's full-colour artwork, if it has one. */
  artworkUrl: string | null = null,
): SceneDesign {
  const sceneRegions: SceneRegion[] = regions
    // The shell is the model's own material, unless the artwork gives it a zone of its own.
    .filter((region) => region.key !== "base" || region.maskUrl)
    .map((region) => {
      const treatment = getTreatment(config, region.key) ?? { kind: "colour" as const, value: region.defaultColour }
      const { colour, filmUrl } = appearance(priceBook, treatment, region.defaultColour, logoUrls)
      return {
        key: region.key,
        maskUrl: region.maskUrl,
        colour,
        filmUrl,
        ...materialFor(treatment.kind, config.finish, config.baseCoat === "chrome"),
        asDesigned: Boolean(artworkUrl) && treatment.kind === "colour" && treatment.value === region.defaultColour,
      }
    })

  return {
    artworkUrl,
    regions: sceneRegions,
    decals: {
      personalisation: config.personalisation ?? [],
      logos: config.logos ?? [],
      logoUrls,
      // Text with no colour of its own picks up the pinstripe, which is what a
      // painter would reach for.
      defaultColour: appearance(
        priceBook,
        getTreatment(config, "accent") ?? { kind: "colour", value: "#ffffff" },
        "#ffffff",
      ).colour,
    },
  }
}

/**
 * The shell's film is drawn from the look rather than as a region, so a customer's own
 * print on the shell is swapped in here once its signed link is known.
 */
export function withShellPrint(look: HelmetLook, config: HelmetConfiguration, uploads: Record<string, string>): HelmetLook {
  const print = config.regions?.base?.print
  return print && uploads[print] ? { ...look, baseTexture: uploads[print] } : look
}

/** The free Lucas Racing visor sticker, as the 3D preview draws it. */
const BRANDED_STICKER: VisorStrip = { enabled: true, branded: true, holographic: true, colour: "#d9dde3", text: "LUCAS RACING", textColour: "#111412", font: "racing" }

/** The colour a design-matched spoiler takes in the preview: the design's first coloured part. */
export function designMainColour(config: HelmetConfiguration, regions: BuilderRegion[]): string {
  const region = regions.find((item) => item.key !== "base" && item.kind === "fill") ?? regions[0]
  if (!region) return "#ffffff"
  const treatment = getTreatment(config, region.key)
  return treatment?.value?.startsWith("#") ? treatment.value : region.defaultColour
}

/** The spoiler's and visor strip's finishes, as the 3D preview needs them. */
export function fittingFinishes(config: HelmetConfiguration, priceBook: PriceBook, hasSpoilers: boolean, designColour = "#ffffff") {
  const spoiler = hasSpoilers ? config.spoilerFinish : undefined
  // A design-matched spoiler is marked out by hand; the preview shows it in the design's main colour.
  const treatment: RegionTreatment | undefined = spoiler && (spoiler.kind === "matched" ? { kind: "colour", value: designColour } : { kind: spoiler.kind, value: spoiler.value })
  const look = spoiler?.chrome ? { metalness: 0.9, roughness: 0.12 } : treatment ? materialFor(treatment.kind, config.finish) : null
  const strip = config.visorStrip?.enabled ? config.visorStrip : null
  const stripFilm = strip?.kind === "film" ? priceBook.films.find((film) => film.id === strip.film) : undefined
  // Holographic stickers are drawn on the silver holographic tape, tinted by the sticker's colour.
  const holographic = strip?.holographic || !strip ? holographicTapes(priceBook).find((tape) => tape.id === "holo-silver") : undefined
  return {
    spoilerFinish: treatment && look ? { ...appearance(priceBook, treatment, "#111412"), ...look } : null,
    // Every helmet comes with the Lucas Racing sticker unless the customer has a bespoke one.
    visorStrip: strip ?? BRANDED_STICKER,
    visorStripFilmUrl: stripFilm?.textureUrl ?? holographic?.textureUrl ?? null,
  }
}
