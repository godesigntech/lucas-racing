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
