import type { HelmetModelId } from "@/types/helmet"
import type { CatalogProduct as Product, ProductCategoryId } from "@/types/product"

export interface ProductFilterState {
  query: string
  category: ProductCategoryId | "all"
  model: HelmetModelId | "all"
}

export const defaultProductFilters: ProductFilterState = {
  query: "",
  category: "all",
  model: "all",
}

export function filterProducts(products: Product[], filters: ProductFilterState): Product[] {
  const query = filters.query.trim().toLowerCase()

  return products.filter((product) => {
    if (filters.category !== "all" && product.category !== filters.category) return false
    if (filters.model !== "all" && !product.models.includes(filters.model)) return false
    if (!query) return true
    const haystack = [product.name, product.tagline, product.description, ...product.features].join(" ").toLowerCase()
    return haystack.includes(query)
  })
}

export function hasActiveFilters(filters: ProductFilterState): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.category !== defaultProductFilters.category ||
    filters.model !== defaultProductFilters.model
  )
}
