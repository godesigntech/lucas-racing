import type { HelmetLook, HelmetModelId } from "@/types/helmet"

export type ProductCategoryId = "racing-lines" | "hydro-dip" | "chrome" | "bespoke"

export const productCategoryIds: ProductCategoryId[] = ["racing-lines", "hydro-dip", "chrome", "bespoke"]

export interface ProductCategory {
  id: ProductCategoryId
  label: string
  description: string
}

export const productBadges = ["Launch design", "New", "Most popular"] as const
export type ProductBadge = (typeof productBadges)[number]

export interface ProductSpec {
  label: string
  value: string
}

export interface Product {
  id: string
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
  isActive: boolean
  sortOrder: number
}

/** A product as shown on the public site, with its available helmet models resolved. */
export interface CatalogProduct extends Product {
  availableModels: { id: HelmetModelId; name: string; shortName: string; summary: string }[]
}
