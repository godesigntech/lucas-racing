import Link from "next/link"

import { cn } from "@/lib/utils"
import type { NewsCategory } from "@/types/news"

/** "All" plus each category, as links (scrolls sideways on phones). */
export function NewsCategoryNav({ categories, active }: { categories: NewsCategory[]; active?: string }) {
  const chip = "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors"
  return (
    <nav aria-label="News categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        <li>
          <Link
            href="/news"
            aria-current={!active ? "page" : undefined}
            className={cn(chip, !active ? "border-carbon bg-carbon text-paper" : "border-carbon/15 bg-card hover:border-carbon/40")}
          >
            All news
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/news/category/${category.slug}`}
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
