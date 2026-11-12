import type { KartFinish } from "@/lib/kart-stickers/options"

/** One AI kart sticker design, as the customer's page shows it. */
export interface KartDesign {
  id: string
  layout: string
  kartModel: string
  prompt: string
  raceNumber: string
  driverName: string
  finish: KartFinish
  /** Storage paths in design-logos. */
  logos: string[]
  /** A short-lived link to the picture, or null if it couldn't be signed. */
  imageUrl: string | null
  createdAt: string
}
