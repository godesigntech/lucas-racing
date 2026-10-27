import type { ShopListingQuery, ShopSort } from "@/lib/data/shop-listing"

const sorts: ShopSort[] = ["featured", "price-asc", "price-desc", "newest", "name"]

export type ShopSearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function price(value: string | undefined): number | undefined {
  if (!value) return undefined
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : undefined
}

/** Turns a shop page's URL search params into a listing query. */
export function readShopQuery(params: ShopSearchParams): Omit<ShopListingQuery, "store" | "categoryIds"> & { filtered: boolean } {
  const sort = first(params.sort) as ShopSort | undefined
  const query = {
    q: first(params.q)?.trim() || undefined,
    inStock: first(params.stock) === "in",
    minPrice: price(first(params.min)),
    maxPrice: price(first(params.max)),
    sort: sort && sorts.includes(sort) ? sort : undefined,
    page: Number(first(params.page)) || 1,
  }
  return { ...query, filtered: Boolean(query.q || query.inStock || query.minPrice !== undefined || query.maxPrice !== undefined) }
}

/** Link that sets (or with null, removes) one filter, keeping the others and going back to page 1. */
export function shopFilterHref(pathname: string, params: ShopSearchParams, key: string, value: string | null): string {
  const next = new URLSearchParams()
  for (const [name, current] of Object.entries(params)) {
    const single = first(current)
    if (single && name !== "page" && name !== key) next.set(name, single)
  }
  if (value) next.set(key, value)
  const search = next.toString()
  return search ? `${pathname}?${search}` : pathname
}

/** Link to another page of results, keeping the other params. */
export function shopPageHref(pathname: string, params: ShopSearchParams, page: number): string {
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const single = first(value)
    if (single && key !== "page") next.set(key, single)
  }
  if (page > 1) next.set("page", String(page))
  const search = next.toString()
  return search ? `${pathname}?${search}` : pathname
}
