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
  /** The photo itself, resized, as a data URL: read by the AI when it is set up. */
  photo?: string
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
  /** True when the AI wrote this concept (false: the built-in colour matcher). */
  aiPowered?: boolean
  /** True when an AI concept image can be generated for it. */
  imageAvailable?: boolean
}

export const quoteHelmets = ["arai-sk6", "bell-kc7", "own", "unsure"] as const
export type QuoteHelmet = (typeof quoteHelmets)[number]

/** Labels for quote_requests.helmet, including "kart" for kart sticker kits. */
export const quoteHelmetLabels: Record<QuoteHelmet | "kart", string> = {
  kart: "Kart stickers",
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
  /** The AI concept image the customer saw, if one was made. */
  aiImagePath: string | null
  palette: string[]
  concept: { look: HelmetLook | null; summary: string; basedOn: string }
  suggestedProducts: string[]
  status: QuoteStatus
  adminNotes: string
  createdAt: string
  /** "design": from the design assistant. "own_helmet": a customer sending their own helmet. "build": a bespoke build from the builder. */
  kind: "design" | "own_helmet" | "build" | "kart_stickers"
  /** Own-helmet requests: storage paths of the photos of their helmet. */
  photoPaths: string[]
  details: OwnHelmetDetails
  /** Bespoke builds: the design as the customer made it in the builder. */
  build: BuildQuoteDetails | null
  /** Kart sticker kits: what the customer asked the AI for. The design is image_path; logos are details.logos. */
  kart: KartStickerDetails | null
  /** The price the workshop sent back, and the deposit due, once priced. */
  quotedPrice: number | null
  quotedDeposit: number | null
  quotedAt: string | null
}

/** A kart sticker kit designed with AI (/kart-stickers), sent for a quote. */
export interface KartStickerDetails {
  layout: string
  kartModel: string
  prompt: string
  raceNumber: string
  driverName: string
  finish: string
}

/** A bespoke build sent from the builder for a price. */
export interface BuildQuoteDetails {
  slug: string
  name: string
  /** The builder configuration, as sent (normalised again before it's shown). */
  config: Record<string, unknown>
  summary: { key: string; label: string; value: string }[]
}

/** What a customer chose when asking us to customise their own helmet. */
export interface OwnHelmetDetails {
  makeModel: string
  size: string
  finishes: string[]
  lacquer: string
  films: { name: string; code: string }[]
  racingName: string
  racingNumber: string
  extraText: string
  /** Storage paths in design-logos. */
  logos: string[]
  /** The design they sketched in the 3D builder on the request page, if they sent one. */
  design: OwnHelmetSketch | null
}

/** A 3D sketch sent with an own-helmet request: the design, and pictures of it (paths in design-uploads). */
export interface OwnHelmetSketch extends BuildQuoteDetails {
  images: string[]
}
