import type { HelmetLook } from "@/types/helmet"

/** A colour picked out of the customer's photo, with a friendly name. */
export interface PaletteColour {
  hex: string
  name: string
}

/** What the customer gives the assistant. */
export interface DesignBrief {
  /** Main colours from their photo, most dominant first. */
  palette: string[]
  /** Anything they typed: colours, finishes, a race number, a design they like. */
  note: string
}

export interface DesignSuggestion {
  slug: string
  name: string
  tagline: string
  look: HelmetLook
  startingPrice: number | null
  /** Why it was suggested, e.g. "Shares your navy and lime". */
  reason: string
  /** Opens this design in the builder with the concept's colours. */
  builderHref?: string
}

export interface DesignAnalysis {
  /** A short description of the concept, written for the customer. */
  summary: string
  palette: PaletteColour[]
  /** The redesign, drawn with the helmet illustration. */
  concept: HelmetLook
  /** Slug of the design the concept's layout comes from. */
  basedOn: string
  /** Closest existing designs, best match first. */
  suggestions: DesignSuggestion[]
}

export const quoteHelmets = ["arai-sk6", "bell-kc7", "own", "unsure"] as const
export type QuoteHelmet = (typeof quoteHelmets)[number]

export const quoteHelmetLabels: Record<QuoteHelmet, string> = {
  "arai-sk6": "New Arai SK-6",
  "bell-kc7": "New Bell KC7",
  own: "I'll send my own helmet",
  unsure: "Not sure yet",
}

export const quoteStatuses = ["new", "contacted", "quoted", "won", "lost"] as const
export type QuoteStatus = (typeof quoteStatuses)[number]

export interface QuoteRequest {
  id: string
  reference: string
  userId: string | null
  name: string
  email: string
  phone: string
  helmet: string
  notes: string
  imagePath: string | null
  palette: string[]
  concept: { look: HelmetLook | null; summary: string; basedOn: string }
  suggestedProducts: string[]
  status: QuoteStatus
  adminNotes: string
  createdAt: string
}
