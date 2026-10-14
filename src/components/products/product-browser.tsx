"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { SearchX } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import {
  defaultProductFilters,
  filterProducts,
  hasActiveFilters,
  type ProductFilterState,
} from "@/lib/products/filter-products"
import type { HelmetModel } from "@/types/helmet"
import type { CatalogProduct as Product, ProductCategory } from "@/types/product"

import { ProductFilters } from "./product-filters"
import { ProductGrid } from "./product-grid"
import { ProductSearch } from "./product-search"

interface ProductBrowserProps {
  products: Product[]
  categories: ProductCategory[]
  models: HelmetModel[]
}

/** Client-side search and filtering. Style and helmet live in the URL so filtered views can be shared. */
export function ProductBrowser({ products, categories, models }: ProductBrowserProps) {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState("")

  const categoryParam = searchParams.get("category")
  const modelParam = searchParams.get("helmet")
  const filters: ProductFilterState = {
    query,
    category: categories.some((item) => item.id === categoryParam)
      ? (categoryParam as ProductFilterState["category"])
      : "all",
    model: models.some((item) => item.id === modelParam) ? (modelParam as ProductFilterState["model"]) : "all",
  }

  const results = filterProducts(products, filters)

  function updateParam(key: "category" | "helmet", value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") params.delete(key)
    else params.set(key, value)
    const search = params.toString()
    // Native history update: syncs with useSearchParams without a server round trip.
    window.history.replaceState(null, "", search ? `/products?${search}` : "/products")
  }

  function resetFilters() {
    setQuery(defaultProductFilters.query)
    window.history.replaceState(null, "", "/products")
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-carbon/10 bg-card p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
        <ProductFilters
          categories={categories}
          models={models}
          category={filters.category}
          model={filters.model}
          onCategoryChange={(value) => updateParam("category", value)}
          onModelChange={(value) => updateParam("helmet", value)}
        />
        <ProductSearch value={query} onChange={setQuery} />
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground" aria-live="polite">
        <p>
          Showing <strong className="text-carbon">{results.length}</strong> of {products.length} designs
        </p>
        {hasActiveFilters(filters) && (
          <Button variant="link" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {results.length > 0 ? (
        <ProductGrid products={results} />
      ) : (
        <EmptyState
          icon={SearchX}
          title="No designs match"
          description="Try a different search or style. A Blank Canvas design can be built around any idea."
          action={<Button onClick={resetFilters}>Show all designs</Button>}
        />
      )}
    </div>
  )
}
