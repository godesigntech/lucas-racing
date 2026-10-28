import type { BellPartColours } from "@/lib/helmet-3d/parts"

// The helmet builder's data model. A build is stored flat (plain string fields)
// so it travels unchanged through share links, the basket, saved designs and
// public.place_order(), which re-prices it in the database.

/** Paintable parts of a template. Plain templates only have a shell (and pinstripe). */
export type PartId = "base" | "graphic" | "accent"
export const partIds: PartId[] = ["base", "graphic", "accent"]

/**
 * What a part is painted with. Chrome and metallic are materials rather than colours;
 * which regions accept them comes from the template's artwork.
 */
export type PartKind = "colour" | "film" | "chrome" | "metallic"

/** A treatment on one editable region of a template. */
export interface RegionTreatment {
  kind: PartKind
  /** Hex colour, film id, or the material name for chrome and metallic. */
  value: string
}

/** Text the customer adds to the helmet. */
export type PersonalKind = "name" | "number" | "initials" | "flag" | "text"

export interface PersonalItem {
  kind: PersonalKind
  /** The text itself, or an ISO country code for a flag. */
  value: string
  position: Placement
  /** Hex colour. Defaults to the pinstripe colour when absent. */
  colour?: string
  font?: string
  /** Relative size, 0.5–2. */
  scale?: number
  /** Degrees, -45 to 45. */
  rotation?: number
}

export interface LogoPlacementItem {
  /** Storage path in the design-logos bucket. */
  path: string
  position: Placement
  scale?: number
  rotation?: number
}

export interface VisorStrip {
  enabled: boolean
  /** Background colour of the strip. */
  colour: string
  text: string
  textColour?: string
  font?: string
}

/** Fonts offered for names, numbers and the visor strip. */
export const helmetFonts = ["racing", "block", "script"] as const
export type HelmetFont = (typeof helmetFonts)[number]

export type FinishId = "gloss" | "satin" | "matte"

/** Where text and logos go on the helmet. */
export type Placement = "sides" | "left" | "right" | "front" | "back" | "top"

export interface HelmetConfiguration extends BellPartColours {
  /**
   * Build format. Absent means the original flat build, which is still read and still
   * priced by place_order(); "2" adds the fields below. The flat shell/graphic/pinstripe
   * fields are kept in step with `regions` so older share links and baskets keep working.
   */
  v?: "2"
  /** Helmet model id, e.g. "bell-kc7". */
  model: string
  size: string
  /** Whether we supply the helmet, or the customer sends their own shell. */
  route?: "new" | "own"
  /** Template (design) slug. */
  template: string
  finish: FinishId

  /** Aero kit id. Supersedes `spoiler` when present. */
  aero?: string
  /** Visor id. */
  visor?: string
  visorStrip?: VisorStrip

  /** Treatment per editable region of the template, keyed by region key. */
  regions?: Record<string, RegionTreatment>
  personalisation?: PersonalItem[]
  logos?: LogoPlacementItem[]

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
