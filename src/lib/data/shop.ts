import "server-only"

import { cacheLife, cacheTag } from "next/cache"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import { requireFullAdmin } from "@/lib/auth/session"
import { ADMIN_PAGE_SIZE, type Paged } from "@/lib/data/admin"
import { isDemoMode } from "@/lib/demo/mode"
import { toShopCategory, toShopProduct, toStore } from "@/lib/shop/mappers"
import { LOW_STOCK } from "@/lib/shop/stock"
import type { ShopProductRow, ShopVariantRow } from "@/lib/supabase/database.types"
import { createClient, createPublicClient } from "@/lib/supabase/server"
import type { InventoryMovement, ShopCategory, ShopProduct, Store, StoreId } from "@/types/shop"

import { cacheTags } from "./cache-tags"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PRODUCT_SELECT = "*, shop_variants(*)"
type ProductWithVariants = ShopProductRow & { shop_variants: ShopVariantRow[] }

/** Strips characters that would break a PostgREST `or()` filter. */
function searchTerm(query: string | undefined): string {
  return (query ?? "").replace(/[%,()*]/g, " ").trim()
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export async function getStores(): Promise<Store[]> {
  "use cache"
  cacheTag(cacheTags.shop)
  cacheLife("hours")
  if (isDemoMode()) return []
  const { data, error } = await createPublicClient().from("stores").select("*").order("sort_order")
  if (error) throw new Error(`Could not load the shops: ${error.message}`)
  return data.map(toStore)
}

export async function getShopCategories(storeId?: StoreId): Promise<ShopCategory[]> {
  "use cache"
  cacheTag(cacheTags.shop)
  cacheLife("hours")
  if (isDemoMode()) return []
  let request = createPublicClient().from("shop_categories").select("*").eq("is_active", true).order("sort_order").order("name")
  if (storeId) request = request.eq("store_id", storeId)
  const { data, error } = await request
  if (error) throw new Error(`Could not load categories: ${error.message}`)
  return data.map(toShopCategory)
}

/**
 * One product with its variants, read at request time so stock is always current.
 * Render inside <Suspense>.
 */
export async function getShopProductBySlug(slug: string): Promise<ShopProduct | null> {
  await connection()
  if (isDemoMode()) return null
  const { data, error } = await createPublicClient()
    .from("shop_products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()
  if (error) throw new Error(`Could not load the product: ${error.message}`)
  if (!data) return null
  const product = toShopProduct(data as ProductWithVariants)
  return { ...product, variants: product.variants.filter((variant) => variant.isActive) }
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type StockFilter = "" | "low" | "out"

/** Products for Admin > Shop, with their variants, filtered by shop, search and stock. */
export async function listAdminShopProducts(options: {
  store?: string
  query?: string
  stock?: string
  page?: number
}): Promise<Paged<ShopProduct>> {
  await requireFullAdmin()
  const empty = { rows: [], total: 0, page: 1, pageCount: 1 }
  if (isDemoMode()) return empty

  const supabase = await createClient()
  const page = Math.max(1, Math.floor(options.page ?? 1) || 1)
  const from = (page - 1) * ADMIN_PAGE_SIZE

  // Stock filters work on variants: find the products with a matching variant first.
  let productIds: string[] | null = null
  if (options.stock === "low" || options.stock === "out") {
    let variants = supabase.from("shop_variants").select("product_id").eq("track_stock", true).eq("is_active", true)
    variants = options.stock === "out" ? variants.lte("stock_quantity", 0) : variants.gt("stock_quantity", 0).lte("stock_quantity", LOW_STOCK)
    const { data, error } = await variants.limit(2000)
    if (error) throw new Error(error.message)
    productIds = [...new Set(data.map((row) => row.product_id))]
    if (productIds.length === 0) return empty
  }

  let request = supabase
    .from("shop_products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .order("store_id")
    .order("sort_order")
    .order("title")
    .range(from, from + ADMIN_PAGE_SIZE - 1)
  if (options.store) request = request.eq("store_id", options.store)
  if (productIds) request = request.in("id", productIds)
  const term = searchTerm(options.query)
  if (term) request = request.or(`title.ilike.%${term}%,slug.ilike.%${term}%,brand.ilike.%${term}%`)

  const { data, count, error } = await request
  if (error) throw new Error(error.message)
  const total = count ?? 0
  return {
    rows: (data as ProductWithVariants[]).map(toShopProduct),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  }
}

export interface AdminShopProductDetail {
  product: ShopProduct
  movements: InventoryMovement[]
}

export async function getAdminShopProduct(id: string): Promise<AdminShopProductDetail> {
  await requireFullAdmin()
  if (isDemoMode() || !UUID.test(id)) notFound()

  const supabase = await createClient()
  const { data, error } = await supabase.from("shop_products").select(PRODUCT_SELECT).eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) notFound()
  const product = toShopProduct(data as ProductWithVariants)

  const variantIds = product.variants.map((variant) => variant.id)
  const { data: movements } = variantIds.length
    ? await supabase
        .from("inventory_movements")
        .select("*")
        .in("variant_id", variantIds)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] }

  return {
    product,
    movements: (movements ?? []).map((row) => ({
      id: row.id,
      variantId: row.variant_id,
      change: row.change,
      quantityAfter: row.quantity_after,
      reason: row.reason as InventoryMovement["reason"],
      orderId: row.order_id,
      note: row.note,
      createdAt: row.created_at,
    })),
  }
}

/** Every category, including hidden ones, for the admin. */
export async function listAdminShopCategories(): Promise<ShopCategory[]> {
  await requireFullAdmin()
  if (isDemoMode()) return []
  const supabase = await createClient()
  const { data, error } = await supabase.from("shop_categories").select("*").order("store_id").order("sort_order").order("name")
  if (error) throw new Error(error.message)
  return data.map(toShopCategory)
}

export async function listAdminStores(): Promise<Store[]> {
  await requireFullAdmin()
  if (isDemoMode()) return []
  const supabase = await createClient()
  const { data, error } = await supabase.from("stores").select("*").order("sort_order")
  if (error) throw new Error(error.message)
  return data.map(toStore)
}
