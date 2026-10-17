import Link from "next/link"

import { cn } from "@/lib/utils"
import type { ShopCategory } from "@/types/shop"

interface StoreCategoryNavProps {
  categories: ShopCategory[]
  /** Slug of the category being shown, if any. */
  active?: string
  /** The store's page, e.g. /racewear; categories link to ?category=<slug>. */
  basePath: string
  label: string
}

/** "All" plus a store's top-level categories as chips (scrolls sideways on phones). */
export function StoreCategoryNav({ categories, active, basePath, label }: StoreCategoryNavProps) {
  const topLevel = categories.filter((category) => !category.parentId)
  if (topLevel.length === 0) return null
  const chip = "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors"
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        <li>
          <Link
            href={basePath}
            aria-current={!active ? "page" : undefined}
            className={cn(chip, !active ? "border-carbon bg-carbon text-paper" : "border-carbon/15 bg-card hover:border-carbon/40")}
          >
            All
          </Link>
        </li>
        {topLevel.map((category) => (
          <li key={category.id}>
            <Link
              href={`${basePath}?category=${category.slug}`}
              aria-current={active === category.slug ? "page" : undefined}
              className={cn(chip, active === category.slug ? "border-carbon bg-carbon text-paper" : "border-carbon/15 bg-card hover:border-carbon/40")}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
