"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { setFilmCategoryPrice } from "@/lib/actions/admin/catalog"
import type { FilmCategorySummary } from "@/lib/data/admin"
import { formatMoney } from "@/lib/format"

import { MoneyInput } from "./money-input"

/** One price for a whole film category, so hundreds of films don't have to be priced one by one. */
export function FilmCategoryPricing({ categories }: { categories: FilmCategorySummary[] }) {
  return (
    <ul className="divide-y divide-carbon/10">
      {categories.map((category) => (
        <CategoryRow key={category.name} category={category} />
      ))}
    </ul>
  )
}

function CategoryRow({ category }: { category: FilmCategorySummary }) {
  const uniform = category.minPrice === category.maxPrice
  const [price, setPrice] = useState(uniform ? category.minPrice : Number.NaN)
  const [isPending, startTransition] = useTransition()
  const valid = Number.isFinite(price) && price >= 0
  const unchanged = uniform && price === category.minPrice
  const inputId = `category-price-${category.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`

  function apply() {
    startTransition(async () => {
      const result = await setFilmCategoryPrice({ category: category.name, price })
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={inputId} className="font-medium">
          {category.name}
        </label>
        <p className="text-xs text-muted-foreground">
          {category.count} {category.count === 1 ? "film" : "films"}
          {category.activeCount !== category.count && ` · ${category.activeCount} available`}
          {" · "}
          {uniform ? `all ${formatMoney(category.minPrice)}` : `${formatMoney(category.minPrice)} to ${formatMoney(category.maxPrice)}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <MoneyInput id={inputId} value={price} onChange={setPrice} className="h-9 w-28" placeholder="Price" />
        <Button size="sm" variant="secondary" onClick={apply} disabled={!valid || unchanged || isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden />}
          Apply to all
        </Button>
      </div>
    </li>
  )
}
