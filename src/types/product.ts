import type { HelmetLook, HelmetModelId } from "@/types/helmet"

export type ProductCategoryId = "racing-lines" | "hydro-dip" | "chrome" | "bespoke"

export interface ProductCategory {
  id: ProductCategoryId
  label: string
  description: string
}

export type ProductBadge = "Launch design" | "New" | "Most popular"

export interface ProductSpec {
  label: string
  value: string
}

export interface Product {
  slug: string
  name: string
  tagline: string
  description: string
  category: ProductCategoryId
  models: HelmetModelId[]
  /** Starting price in GBP for the customisation. `null` means priced on request. */
  startingPrice: number | null
  badge?: ProductBadge
  features: string[]
  specs: ProductSpec[]
  look: HelmetLook
}
