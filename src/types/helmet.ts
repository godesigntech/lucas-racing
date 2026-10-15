export type HelmetModelId = string

export interface HelmetModel {
  id: HelmetModelId
  brand: string
  name: string
  shortName: string
  summary: string
  /** Price added when we supply a new helmet. */
  newHelmetPrice: number
  sizes: string[]
  isActive: boolean
  sortOrder: number
}

/** Graphic layouts the helmet illustration knows how to draw. */
export const helmetLayouts = ["apex", "twin", "split", "shard", "halo", "flow", "blank"] as const
export type HelmetLayout = (typeof helmetLayouts)[number]

export const helmetFinishes = ["gloss", "matte", "chrome"] as const
export type HelmetFinish = (typeof helmetFinishes)[number]

/** How a film is drawn in the illustrated preview. */
export type FilmPattern = "none" | "carbon" | "forged" | "hex" | "camo"

export const filmPatterns: FilmPattern[] = ["none", "carbon", "forged", "hex", "camo"]

/** Kept for the illustration components, which draw by pattern. */
export type FilmId = FilmPattern

/** Everything needed to draw a helmet: shared by product art and the configurator preview. */
export interface HelmetLook {
  layout: HelmetLayout
  finish: HelmetFinish
  /** Main shell colour. */
  base: string
  /** Colour of the layout's graphic. */
  graphic: string
  /** Thin pinstripe / accent colour. */
  accent: string
  /** Film pattern applied to the graphic area ("none" for solid colour). */
  film: FilmPattern
  /** Photo of the chosen hydro-dip film. When set it replaces the illustrated pattern. */
  filmTexture?: string
  /** Rubber trim colour (eye-port and base). */
  trim: string
  spoiler: boolean
  number?: string
  name?: string
}
