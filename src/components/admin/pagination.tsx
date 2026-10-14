import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  hrefFor: (page: number) => string
  noun: string
}

export function Pagination({ page, pageCount, total, pageSize, hrefFor, noun }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const link = "inline-flex h-9 items-center gap-1 rounded-full border border-carbon/15 bg-card px-3 text-sm font-medium transition-colors hover:border-carbon/40"
  const disabled = "pointer-events-none opacity-40"

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-carbon/10 px-5 py-4 text-sm text-muted-foreground sm:flex-row">
      <p>
        {total === 0 ? `No ${noun}` : `Showing ${from}–${to} of ${total} ${noun}`}
      </p>
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-2">
          <Link
            href={hrefFor(page - 1)}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={cn(link, page <= 1 && disabled)}
          >
            <ChevronLeft className="size-4" aria-hidden /> Previous
          </Link>
          <span className="tabular-nums">
            {page} / {pageCount}
          </span>
          <Link
            href={hrefFor(page + 1)}
            aria-disabled={page >= pageCount}
            tabIndex={page >= pageCount ? -1 : undefined}
            className={cn(link, page >= pageCount && disabled)}
          >
            Next <ChevronRight className="size-4" aria-hidden />
          </Link>
        </nav>
      )}
    </div>
  )
}
