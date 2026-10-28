import type { HelmetModelId } from "@/types/helmet"

/** How much of a template's 3D artwork the 3D artist has actually delivered. */
export type ArtworkStatus = "ready" | "pending" | "placeholder"

/** What a region is for. Pinstripes are listed separately so step 7 can show only the lines. */
export type RegionKind = "fill" | "pinstripe" | "trim"

/**
 * One separately editable area of a template: a shape the customer colours, a racing
 * line, or a painted edge. Which treatments it accepts comes from the artwork, so the
 * builder can grey out what the masks can't carry.
 */
export interface TemplateRegion {
  id: string
  key: string
  label: string
  kind: RegionKind
  /** Greyscale mask in UV space, or null for the shell (everything the others don't cover). */
  maskUrl: string | null
  /** Element to recolour when the template is vector artwork. */
  svgElementId: string | null
  defaultColour: string
  allowsFilm: boolean
  allowsChrome: boolean
  allowsMetallic: boolean
  sortOrder: number
}

/**
 * The artwork for one design on one helmet model. Masks are cut against that model's
 * UVs, so a design has a separate template per helmet it's offered on.
 */
export interface DesignTemplate {
  id: string
  productSlug: string
  modelId: HelmetModelId
  svgUrl: string | null
  graphicMaskUrl: string | null
  accentMaskUrl: string | null
  thumbnailUrl: string | null
  artworkStatus: ArtworkStatus
  isActive: boolean
  sortOrder: number
  regions: TemplateRegion[]
}

/** An aero kit swaps a mesh in the model; null means the shell as supplied. */
export interface AeroKit {
  id: string
  modelId: HelmetModelId
  name: string
  summary: string | null
  meshName: string | null
  price: number | null
  isActive: boolean
  sortOrder: number
}

export type VisorKind = "clear" | "smoked" | "coloured" | "iridium"

export interface Visor {
  id: string
  modelId: HelmetModelId
  name: string
  kind: VisorKind
  /** Preview only: the tint, how much it hides, and how mirrored it looks. */
  tint: string
  opacity: number
  metalness: number
  price: number | null
  isActive: boolean
  sortOrder: number
}

/** A size a model is offered in, with any surcharge. */
export interface HelmetSizeOption {
  modelId: HelmetModelId
  size: string
  price: number | null
  isActive: boolean
  sortOrder: number
}
