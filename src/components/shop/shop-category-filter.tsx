import Link from "next/link"

import { shopFilterHref, type ShopSearchParams } from "@/lib/shop/shop-query"
import { cn } from "@/lib/utils"
import type { ShopCategory } from "@/types/shop"

interface ShopCategoryFilterProps {
  categories: ShopCategory[]
  /** Slug of the chosen category, if any. */
  active?: string
  /** The URL param this row sets, so each section on a page filters on its own. */
  param: string
  pathname: string
  params: ShopSearchParams
  label: string
}

/** Each top-level category followed by its subcategories. */
function inMenuOrder(categories: ShopCategory[]): ShopCategory[] {
  return categories
    .filter((category) => !category.parentId)
    .flatMap((parent) => [parent, ...categories.filter((child) => child.parentId === parent.id)])
}

/**
 * "All" plus every category as chips, filtering one section of a shop page
 * through the URL (keeps the other filters; scrolls sideways on phones).
 */
export function ShopCategoryFilter({ categories, active, param, pathname, params, label }: ShopCategoryFilterProps) {
  const items = inMenuOrder(categories)
  if (items.length === 0) return null
  const chip = "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors"
  const style = (selected: boolean) => cn(chip, selected ? "border-carbon bg-carbon text-paper" : "border-carbon/15 bg-card hover:border-carbon/40")
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        <li>
          <Link href={shopFilterHref(pathname, params, param, null)} scroll={false} aria-current={!active ? "true" : undefined} className={style(!active)}>
            All
          </Link>
        </li>
        {items.map((category) => (
          <li key={category.id}>
            <Link
              href={shopFilterHref(pathname, params, param, category.slug)}
              scroll={false}
              aria-current={active === category.slug ? "true" : undefined}
              className={style(active === category.slug)}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
