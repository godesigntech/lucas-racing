/** How a customisable part can be finished, priced from the helmet price list. */
export type FinishType = "paint" | "film" | "chrome"
export const finishTypes: FinishType[] = ["paint", "film", "chrome"]

/**
 * Live 2D preview of a customisable part: its photo and the area that gets the finish.
 * Edited in Admin > Shop; stored in shop_products.custom_preview.
 */
export interface PartPreview {
  /** The photo the finish is drawn onto (one of the product's photos). */
  image: string
  /** PNG whose opaque pixels mark the finished area. Null: found from the plain background. */
  mask: string | null
  /** How much of the photo's fine detail (engraving, edges) shows through the finish, 0 to 1. */
  detail: number
  /** Size of the hydro-dip film pattern on the part, 1 = normal. */
  filmScale: number
}

export type StoreId = "ms-kart" | "teamwear" | "hydrokarts-parts" | "delta"

export interface Store {
  id: StoreId
  name: string
  description: string
  /** False for Delta: customers browse here and order with the partner. */
  purchasable: boolean
  sortOrder: number
}

export interface ShopCategory {
  id: string
  storeId: StoreId
  parentId: string | null
  name: string
  slug: string
  description: string
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
}

export interface ShopSpec {
  label: string
  value: string
}

export type ShopProductSource = "manual" | "ms_kart_feed" | "delta_feed"

export interface ShopVariant {
  id: string
  productId: string
  sku: string
  /** e.g. { Size: "M", Colour: "Black" }; empty for single-variant products. */
  options: Record<string, string>
  price: number
  compareAtPrice: number | null
  stockQuantity: number
  trackStock: boolean
  allowBackorder: boolean
  weightGrams: number | null
  isActive: boolean
  sortOrder: number
}

export interface ShopProduct {
  id: string
  storeId: StoreId
  categoryId: string | null
  slug: string
  title: string
  brand: string
  description: string
  specs: ShopSpec[]
  images: string[]
  /** Names of the options its variants differ by, e.g. ["Size", "Colour"]. */
  optionNames: string[]
  source: ShopProductSource
  externalId: string | null
  externalUrl: string | null
  isActive: boolean
  featured: boolean
  customisable: boolean
  /** Finishes a customisable part can be ordered in; empty means it is sold as it comes. */
  customFinishes: FinishType[]
  /** Added to the variant price when a finish is chosen. */
  customFee: number
  /** Live preview settings; null uses the main photo with an automatic outline. */
  customPreview: PartPreview | null
  /** Clicks through to the partner's site (Delta), counted per product. */
  externalClicks: number
  /** Size guide shown on the product page (Markdown, tables allowed). */
  sizeGuide: string
  sortOrder: number
  variants: ShopVariant[]
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "backorder" | "untracked"

export interface InventoryMovement {
  id: number
  variantId: string
  change: number
  quantityAfter: number
  reason: "order" | "cancellation" | "adjustment" | "import"
  orderId: string | null
  note: string
  createdAt: string
}
