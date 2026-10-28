import type { SceneDesign, SceneRegion } from "@/components/helmet-3d/helmet-scene"
import type { BuilderRegion } from "@/lib/configurator/regions"
import { getTreatment } from "@/lib/configurator/regions"
import type { PriceBook } from "@/types/catalog"
import type { FinishId, HelmetConfiguration, PartKind } from "@/types/configurator"

/**
 * Turns a build into the textures and materials the 3D preview needs.
 *
 * The shell is handled by the model's own material (colour, lacquer, whole-shell film);
 * everything else is a region painted over it, so this only describes the non-shell ones.
 */

/** Lacquer roughness, matching the shader's paint presets. */
const lacquerRoughness: Record<FinishId, number> = { gloss: 0.35, satin: 0.6, matte: 1 }

function materialFor(kind: PartKind, finish: FinishId): { metalness: number; roughness: number } {
  if (kind === "chrome") return { metalness: 1, roughness: 0.08 }
  if (kind === "metallic") return { metalness: 0.65, roughness: 0.28 }
  if (kind === "film") return { metalness: 0, roughness: 0.4 }
  return { metalness: 0, roughness: lacquerRoughness[finish] }
}

const CHROME_SWATCH = "#c9ccd1"
const METALLIC_SWATCH = "#b8bdc4"
const FILM_BASE = "#8a8d8b"

/** The colour the shader should paint a region, and the film photo to project over it. */
function appearance(
  priceBook: PriceBook,
  treatment: { kind: PartKind; value: string },
  fallback: string,
): { colour: string; filmUrl: string | null } {
  if (treatment.kind === "chrome") return { colour: CHROME_SWATCH, filmUrl: null }
  if (treatment.kind === "metallic") {
    // Metallic keeps the chosen colour; the metalness in the shader does the rest.
    const swatch = priceBook.options.base.find((option) => option.value === treatment.value)?.swatch
    return { colour: swatch ?? (treatment.value.startsWith("#") ? treatment.value : METALLIC_SWATCH), filmUrl: null }
  }
  if (treatment.kind === "film") {
    const film = priceBook.films.find((item) => item.id === treatment.value)
    return { colour: FILM_BASE, filmUrl: film?.textureUrl ?? null }
  }
  const swatch = priceBook.options.base.find((option) => option.value === treatment.value)?.swatch
  return { colour: swatch ?? (treatment.value.startsWith("#") ? treatment.value : fallback), filmUrl: null }
}

export function buildSceneDesign(
  config: HelmetConfiguration,
  regions: BuilderRegion[],
  priceBook: PriceBook,
  logoUrls: Record<string, string> = {},
): SceneDesign {
  const sceneRegions: SceneRegion[] = regions
    .filter((region) => region.key !== "base")
    .map((region) => {
      const treatment = getTreatment(config, region.key) ?? { kind: "colour" as const, value: region.defaultColour }
      const { colour, filmUrl } = appearance(priceBook, treatment, region.defaultColour)
      return {
        key: region.key,
        maskUrl: region.maskUrl,
        colour,
        filmUrl,
        ...materialFor(treatment.kind, config.finish),
      }
    })

  return {
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
