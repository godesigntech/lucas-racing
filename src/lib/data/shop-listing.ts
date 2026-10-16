import "server-only"

import { connection } from "next/server"

import { isDemoMode } from "@/lib/demo/mode"
import type { ShopProductListingRow } from "@/lib/supabase/database.types"
import { createPublicClient } from "@/lib/supabase/server"
import type { ShopCategory, StoreId } from "@/types/shop"

export const SHOP_PAGE_SIZE = 24

export const shopSorts = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A–Z" },
] as const
export type ShopSort = (typeof shopSorts)[number]["value"]

export interface ShopListingItem {
  id: string
  storeId: StoreId
  slug: string
  title: string
  brand: string
  imageUrl: string | null
  minPrice: number
  maxPrice: number
  compareAtPrice: number | null
  variantCount: number
  /** Set when there's exactly one option, so the grid can add it straight to the basket. */
  singleVariantId: string | null
  inStock: boolean
  lowStock: boolean
  stockTotal: number
  featured: boolean
}

export interface ShopListingQuery {
  store: StoreId
  /** A category and its subcategories. */
  categoryIds?: string[]
  q?: string
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  sort?: ShopSort
  page?: number
}

export interface ShopListingResult {
  items: ShopListingItem[]
  total: number
  page: number
  pageCount: number
}

function toItem(row: ShopProductListingRow): ShopListingItem {
  return {
    id: row.id,
    storeId: row.store_id as StoreId,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    imageUrl: row.image_url,
    minPrice: Number(row.min_price),
    maxPrice: Number(row.max_price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    variantCount: row.variant_count,
    singleVariantId: row.single_variant_id,
    inStock: row.in_stock,
    lowStock: row.low_stock,
    stockTotal: row.stock_total,
    featured: row.featured,
  }
}

/** Strips characters that would break a PostgREST `or()` filter. */
function searchTerm(query: string | undefined): string {
  return (query ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 80)
}

/**
 * Products for a shop grid. Read at request time (stock changes with every order),
 * so render inside <Suspense>.
 */
export async function listShopProducts(query: ShopListingQuery): Promise<ShopListingResult> {
  await connection()
  const page = Math.max(1, Math.floor(query.page ?? 1) || 1)
  if (isDemoMode()) return { items: [], total: 0, page, pageCount: 1 }

  const from = (page - 1) * SHOP_PAGE_SIZE
  let request = createPublicClient()
    .from("shop_product_listing")
    .select("*", { count: "exact" })
    .eq("store_id", query.store)
    .eq("is_active", true)

  if (query.categoryIds?.length) request = request.in("category_id", query.categoryIds)
  if (query.inStock) request = request.eq("in_stock", true)
  if (query.minPrice !== undefined) request = request.gte("max_price", query.minPrice)
  if (query.maxPrice !== undefined) request = request.lte("min_price", query.maxPrice)
  const term = searchTerm(query.q)
  if (term) request = request.or(`title.ilike.%${term}%,brand.ilike.%${term}%,skus.ilike.%${term}%`)

  switch (query.sort) {
    case "price-asc":
      request = request.order("min_price").order("title")
      break
    case "price-desc":
      request = request.order("max_price", { ascending: false }).order("title")
      break
    case "newest":
      request = request.order("created_at", { ascending: false })
      break
    case "name":
      request = request.order("title")
      break
    default:
      request = request.order("featured", { ascending: false }).order("sort_order").order("title")
  }

  const { data, count, error } = await request.range(from, from + SHOP_PAGE_SIZE - 1)
  if (error) throw new Error(`Could not load products: ${error.message}`)
  const total = count ?? 0
  return { items: data.map(toItem), total, page, pageCount: Math.max(1, Math.ceil(total / SHOP_PAGE_SIZE)) }
}

/** Featured products for a shop's landing page. */
export async function getFeaturedShopProducts(store: StoreId, limit = 4): Promise<ShopListingItem[]> {
  await connection()
  if (isDemoMode()) return []
  const { data, error } = await createPublicClient()
    .from("shop_product_listing")
    .select("*")
    .eq("store_id", store)
    .eq("is_active", true)
    .eq("featured", true)
    .order("sort_order")
    .limit(limit)
  if (error) throw new Error(`Could not load featured products: ${error.message}`)
  return data.map(toItem)
}

/** Other products from the same category (or shop), for "You might also need". */
export async function getRelatedShopProducts(
  product: { id: string; storeId: StoreId; categoryId: string | null },
  limit = 4,
): Promise<ShopListingItem[]> {
  await connection()
  if (isDemoMode()) return []
  let request = createPublicClient()
    .from("shop_product_listing")
    .select("*")
    .eq("store_id", product.storeId)
    .eq("is_active", true)
    .neq("id", product.id)
  if (product.categoryId) request = request.eq("category_id", product.categoryId)
  const { data, error } = await request.order("featured", { ascending: false }).order("sort_order").limit(limit)
  if (error) throw new Error(`Could not load related products: ${error.message}`)
  return data.map(toItem)
}

/** A category plus the ids of its subcategories (one level deep), for filtering. */
export function categoryWithChildren(categories: ShopCategory[], category: ShopCategory): string[] {
  return [category.id, ...categories.filter((child) => child.parentId === category.id).map((child) => child.id)]
}
