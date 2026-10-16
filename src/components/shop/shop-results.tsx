import Link from "next/link"
import { ArrowLeft, ArrowRight, PackageSearch } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SHOP_PAGE_SIZE, type ShopListingResult } from "@/lib/data/shop-listing"
import { cn } from "@/lib/utils"

import { ShopProductCard } from "./shop-product-card"

interface ShopResultsProps {
  result: ShopListingResult
  /** Builds the link for another page of results, keeping the filters. */
  pageHref: (page: number) => string
  filtered: boolean
  /** Shown when the shop has no products at all yet. */
  emptyTitle?: string
  emptyDescription?: string
}

/** The product grid with a count and previous/next paging. */
export function ShopResults({ result, pageHref, filtered, emptyTitle, emptyDescription }: ShopResultsProps) {
  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-carbon/20 bg-card px-6 py-16 text-center">
        <PackageSearch className="size-10 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 font-display text-2xl font-bold uppercase">
          {filtered ? "Nothing matches those filters" : (emptyTitle ?? "Products coming soon")}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {filtered
            ? "Try a different search or clear the filters. Can't find a part? Ask us and we'll track it down."
            : (emptyDescription ?? "We're adding the range now. Tell us what you need and we'll help in the meantime.")}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/contact?${new URLSearchParams({ message: "Hi, I'm looking for a part: " })}`}>Ask us about a part</Link>
        </Button>
      </div>
    )
  }

  const first = (result.page - 1) * SHOP_PAGE_SIZE + 1
  const last = first + result.items.length - 1

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {first}–{last} of {result.total} {result.total === 1 ? "product" : "products"}
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {result.items.map((item) => (
          <li key={item.id}>
            <ShopProductCard item={item} />
          </li>
        ))}
      </ul>
      {result.pageCount > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3 pt-2">
          <Button asChild variant="outline" className={cn(result.page <= 1 && "pointer-events-none opacity-40")} aria-disabled={result.page <= 1}>
            <Link href={pageHref(result.page - 1)} scroll={false}>
              <ArrowLeft /> Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {result.page} of {result.pageCount}
          </span>
          <Button
            asChild
            variant="outline"
            className={cn(result.page >= result.pageCount && "pointer-events-none opacity-40")}
            aria-disabled={result.page >= result.pageCount}
          >
            <Link href={pageHref(result.page + 1)} scroll={false}>
              Next <ArrowRight />
            </Link>
          </Button>
        </nav>
      )}
    </div>
  )
}
