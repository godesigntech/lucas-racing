"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ProductFilterState } from "@/lib/products/filter-products"
import type { HelmetModel } from "@/types/helmet"
import type { ProductCategory } from "@/types/product"

interface ProductFiltersProps {
  categories: ProductCategory[]
  models: HelmetModel[]
  category: ProductFilterState["category"]
  model: ProductFilterState["model"]
  onCategoryChange: (category: ProductFilterState["category"]) => void
  onModelChange: (model: ProductFilterState["model"]) => void
}

export function ProductFilters({
  categories,
  models,
  category,
  model,
  onCategoryChange,
  onModelChange,
}: ProductFiltersProps) {
  const options = [{ id: "all" as const, label: "All designs" }, ...categories]
  const modelLabel = models.find((item) => item.id === model)?.name ?? "All helmets"

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div role="group" aria-label="Filter by style" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:pb-0">
        {options.map((option) => {
          const active = category === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onCategoryChange(option.id)}
              className={cn(
                "h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-carbon bg-carbon text-paper"
                  : "border-carbon/15 bg-card text-carbon/80 hover:border-carbon/40 hover:text-carbon",
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <Select value={model} onValueChange={(value) => onModelChange(value as ProductFilterState["model"])}>
        <SelectTrigger aria-label="Filter by helmet" className="h-10 w-full rounded-full md:w-44">
          {/* Explicit label so the value also renders before hydration. */}
          <SelectValue>{modelLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All helmets</SelectItem>
          {models.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
