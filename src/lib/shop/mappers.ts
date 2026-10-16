import type { Json, ShopCategoryRow, ShopProductRow, ShopVariantRow, StoreRow } from "@/lib/supabase/database.types"
import type {
  ShopCategory,
  ShopProduct,
  ShopProductSource,
  ShopSpec,
  ShopVariant,
  Store,
  StoreId,
} from "@/types/shop"

// Shared by server data loaders and the browser (basket), so no server-only imports.

const num = (value: unknown): number => (value === null || value === undefined ? 0 : Number(value))

function toOptions(value: Json): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).map(([key, option]) => [key, String(option ?? "")]))
}

function toSpecs(value: Json): ShopSpec[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((spec) =>
    spec && typeof spec === "object" && !Array.isArray(spec)
      ? [{ label: String(spec.label ?? ""), value: String(spec.value ?? "") }]
      : [],
  )
}

export function toStore(row: StoreRow): Store {
  return {
    id: row.id as StoreId,
    name: row.name,
    description: row.description,
    purchasable: row.purchasable,
    sortOrder: row.sort_order,
  }
}

export function toShopCategory(row: ShopCategoryRow): ShopCategory {
  return {
    id: row.id,
    storeId: row.store_id as StoreId,
    parentId: row.parent_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

export function toShopVariant(row: ShopVariantRow): ShopVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku ?? "",
    options: toOptions(row.option_values),
    price: num(row.price),
    compareAtPrice: row.compare_at_price === null ? null : num(row.compare_at_price),
    stockQuantity: row.stock_quantity,
    trackStock: row.track_stock,
    allowBackorder: row.allow_backorder,
    weightGrams: row.weight_grams,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

export function toShopProduct(row: ShopProductRow & { shop_variants?: ShopVariantRow[] }): ShopProduct {
  return {
    id: row.id,
    storeId: row.store_id as StoreId,
    categoryId: row.category_id,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    description: row.description,
    specs: toSpecs(row.specs),
    images: row.images ?? [],
    optionNames: row.option_names ?? [],
    source: row.source as ShopProductSource,
    externalId: row.external_id,
    externalUrl: row.external_url,
    isActive: row.is_active,
    featured: row.featured,
    customisable: row.customisable,
    sortOrder: row.sort_order,
    variants: (row.shop_variants ?? []).map(toShopVariant).sort((a, b) => a.sortOrder - b.sortOrder),
  }
}
