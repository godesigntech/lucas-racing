export type HelmetModelId = "arai-sk6" | "bell-kc7"

export interface HelmetModel {
  id: HelmetModelId
  brand: string
  name: string
  shortName: string
  summary: string
}

/** Graphic layouts the helmet illustration knows how to draw. */
export type HelmetLayout = "apex" | "twin" | "split" | "shard" | "halo" | "flow" | "blank"

export type HelmetFinish = "gloss" | "matte" | "chrome"

export type FilmId = "none" | "carbon" | "forged" | "hex" | "camo"

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
  /** Film applied to the graphic area ("none" for solid colour). */
  film: FilmId
  /** Rubber trim colour (eye-port and base). */
  trim: string
  spoiler: boolean
  number?: string
  name?: string
}
