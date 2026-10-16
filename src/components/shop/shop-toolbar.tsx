"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, Search, X } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const sorts = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A–Z" },
]

const field =
  "h-10 rounded-full border border-input bg-card px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

/** Search, sort, in-stock and price filters. Every change updates the URL (page resets to 1). Render in <Suspense>. */
export function ShopToolbar() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState(params.get("q") ?? "")
  const [minPrice, setMinPrice] = useState(params.get("min") ?? "")
  const [maxPrice, setMaxPrice] = useState(params.get("max") ?? "")

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete("page")
    const search = next.toString()
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }))
  }

  const filtered = ["q", "stock", "min", "max", "sort"].some((key) => params.has(key))

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form
          role="search"
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            update({ q: query.trim() || null })
          }}
        >
          <label htmlFor="shop-search" className="sr-only">
            Search products
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="shop-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => query.trim() !== (params.get("q") ?? "") && update({ q: query.trim() || null })}
            placeholder="Search by name or part number"
            className={cn(field, "w-full pl-10")}
          />
        </form>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={params.get("sort") ?? "featured"} onValueChange={(value) => update({ sort: value === "featured" ? null : value })}>
            <SelectTrigger className="h-10 w-48 rounded-full" aria-label="Sort products">
              <SelectValue>{sorts.find((sort) => sort.value === (params.get("sort") ?? "featured"))?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sorts.map((sort) => (
                <SelectItem key={sort.value} value={sort.value}>
                  {sort.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Updating" />}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="shop-in-stock"
            checked={params.get("stock") === "in"}
            onCheckedChange={(checked) => update({ stock: checked === true ? "in" : null })}
          />
          <Label htmlFor="shop-in-stock" className="text-sm font-normal">
            In stock only
          </Label>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            update({ min: minPrice || null, max: maxPrice || null })
          }}
        >
          <span className="text-sm text-muted-foreground">Price</span>
          <label htmlFor="shop-min" className="sr-only">
            Minimum price
          </label>
          <input
            id="shop-min"
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="£ min"
            className={cn(field, "w-24 px-3")}
          />
          <span aria-hidden className="text-muted-foreground">–</span>
          <label htmlFor="shop-max" className="sr-only">
            Maximum price
          </label>
          <input
            id="shop-max"
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="£ max"
            className={cn(field, "w-24 px-3")}
          />
          <button type="submit" className="h-10 rounded-full border border-carbon/15 px-4 text-sm font-medium hover:border-carbon/40">
            Apply
          </button>
        </form>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setMinPrice("")
              setMaxPrice("")
              startTransition(() => router.replace(pathname, { scroll: false }))
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-carbon hover:underline"
          >
            <X className="size-3.5" aria-hidden /> Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
