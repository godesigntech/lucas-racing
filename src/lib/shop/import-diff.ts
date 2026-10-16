import type { Json, ShopProductRow, ShopVariantRow } from "@/lib/supabase/database.types"
import type { ImportProduct } from "@/lib/validations/shop-import"

// How an imported product compares with the one already in the shop. Kept free of
// server-only code so it can be tested on its own.

export interface ExistingVariant {
  id: string
  sku: string | null
  option_values: Json
  price: number
  rrp: number | null
  weight_grams: number | null
  price_is_manual: boolean
}

export interface ExistingProduct {
  id: string
  external_id: string | null
  title: string
  description: string
  brand: string
  category_id: string | null
  images: string[]
  option_names: string[]
  manual_fields: string[]
  shop_variants: ExistingVariant[]
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "product"
}

export const sameNumber = (a: number | null, b: number | null) => (a === null || b === null ? a === b : Math.abs(Number(a) - Number(b)) < 0.005)

export function variantKey(variant: { sku: string | null; optionValue?: string; option_values?: Json }, optionName: string): string {
  if (variant.sku) return `sku:${variant.sku.toLowerCase()}`
  const value =
    variant.optionValue ??
    (variant.option_values && typeof variant.option_values === "object" && !Array.isArray(variant.option_values)
      ? String((variant.option_values as Record<string, unknown>)[optionName] ?? "")
      : "")
  return `opt:${value.toLowerCase()}`
}

/** What would change for one product, without writing anything. */
export function diffProduct(product: ImportProduct, existing: ExistingProduct, categoryId: string | null, optionName: string) {
  const manual = new Set(existing.manual_fields)
  const productChanges: Partial<ShopProductRow> = {}
  if (!manual.has("title") && existing.title !== product.title) productChanges.title = product.title
  if (!manual.has("description") && product.description && existing.description !== product.description) productChanges.description = product.description
  if (!manual.has("brand") && product.brand && existing.brand !== product.brand) productChanges.brand = product.brand
  if (!manual.has("category") && categoryId && existing.category_id !== categoryId) productChanges.category_id = categoryId
  if (!manual.has("images") && product.images.length && JSON.stringify(existing.images) !== JSON.stringify(product.images)) productChanges.images = product.images

  const byKey = new Map(existing.shop_variants.map((variant) => [variantKey(variant, optionName), variant]))
  const variantUpdates: { id: string; changes: Partial<ShopVariantRow> }[] = []
  const newVariants: ImportProduct["variants"] = []
  for (const variant of product.variants) {
    const match = byKey.get(variantKey({ sku: variant.sku || null, optionValue: variant.optionValue }, optionName))
    if (!match) {
      newVariants.push(variant)
      continue
    }
    const changes: Partial<ShopVariantRow> = {}
    // The supplier's price is always recorded; it becomes the selling price unless an admin set their own.
    if (!sameNumber(match.rrp, variant.price)) changes.rrp = variant.price
    if (!match.price_is_manual && !sameNumber(match.price, variant.price)) changes.price = variant.price
    if (variant.weightGrams !== null && match.weight_grams !== variant.weightGrams) changes.weight_grams = variant.weightGrams
    if (Object.keys(changes).length) variantUpdates.push({ id: match.id, changes })
  }
  const changed = Object.keys(productChanges).length > 0 || variantUpdates.length > 0 || newVariants.length > 0
  return { productChanges, variantUpdates, newVariants, changed }
}
