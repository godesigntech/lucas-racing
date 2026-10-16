import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/** Page numbers to show: always the first and last, the current one and its neighbours. */
function pageList(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pageCount))
  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | "gap")[] = []
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push("gap")
    result.push(value)
  })
  return result
}

interface NewsPaginationProps {
  page: number
  pageCount: number
  hrefFor: (page: number) => string
}

/** Numbered page links for the news archive; plain links, so every page can be crawled. */
export function NewsPagination({ page, pageCount, hrefFor }: NewsPaginationProps) {
  if (pageCount <= 1) return null
  const item = "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border px-3 text-sm font-semibold transition-colors"
  const idle = "border-carbon/15 bg-card hover:border-carbon/40"

  return (
    <nav aria-label="News pages" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(item, idle)}>
          <ChevronLeft className="size-4" aria-hidden />
          <span className="max-sm:sr-only">Newer</span>
        </Link>
      ) : (
        <span className={cn(item, idle, "pointer-events-none opacity-40")} aria-hidden>
          <ChevronLeft className="size-4" />
          <span className="max-sm:sr-only">Newer</span>
        </span>
      )}
      <ol className="flex items-center gap-1.5">
        {pageList(page, pageCount).map((value, index) =>
          value === "gap" ? (
            <li key={`gap-${index}`} aria-hidden className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={value}>
              <Link
                href={hrefFor(value)}
                aria-current={value === page ? "page" : undefined}
                aria-label={`Page ${value}`}
                className={cn(item, value === page ? "border-carbon bg-carbon text-paper" : idle)}
              >
                {value}
              </Link>
            </li>
          ),
        )}
      </ol>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(item, idle)}>
          <span className="max-sm:sr-only">Older</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(item, idle, "pointer-events-none opacity-40")} aria-hidden>
          <span className="max-sm:sr-only">Older</span>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  )
}
