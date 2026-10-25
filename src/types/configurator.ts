import type { BellPartColours } from "@/lib/helmet-3d/parts"

// The helmet builder's data model. A build is stored flat (plain string fields)
// so it travels unchanged through share links, the basket, saved designs and
// public.place_order(), which re-prices it in the database.

/** Paintable parts of a template. Plain templates only have a shell (and pinstripe). */
export type PartId = "base" | "graphic" | "accent"
export const partIds: PartId[] = ["base", "graphic", "accent"]

/** What a part is painted with. Chrome is for the shell only. */
export type PartKind = "colour" | "film" | "chrome"

export type FinishId = "gloss" | "satin" | "matte"

/** Where text and logos go on the helmet. */
export type Placement = "sides" | "left" | "right" | "front" | "back" | "top"

export interface HelmetConfiguration extends BellPartColours {
  /** Helmet model id, e.g. "bell-kc7". Always supplied new. */
  model: string
  size: string
  /** Template (design) slug. */
  template: string
  finish: FinishId

  baseKind: PartKind
  /** Hex colour, or film id when the kind is "film" (ignored for chrome). */
  base: string
  graphicKind?: PartKind
  graphic?: string
  accentKind?: PartKind
  accent?: string

  /** Rubber trim colour (hex). */
  trim: string
  spoiler: "yes" | "no"

  riderName?: string
  namePosition?: Placement
  raceNumber?: string
  numberPosition?: Placement
  /** Storage path of an uploaded logo in the design-logos bucket. */
  logo?: string
  logoPosition?: Placement
}

export interface ConfigSummaryLine {
  key: string
  label: string
  value: string
}

export interface PriceLine {
  label: string
  amount: number
}

export interface PriceBreakdown {
  lines: PriceLine[]
  total: number
}
