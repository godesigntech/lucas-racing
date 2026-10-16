import Link from "next/link"
import { Newspaper } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { Button } from "@/components/ui/button"
import type { Paged } from "@/lib/data/admin"
import type { NewsCategory, NewsPost } from "@/types/news"

import { NewsCard } from "./news-card"
import { NewsCategoryNav } from "./news-category-nav"
import { NewsPagination } from "./news-pagination"

interface NewsArchiveProps {
  categories: NewsCategory[]
  /** The category being shown, if any. */
  category?: NewsCategory
  result: Paged<NewsPost>
  hrefFor: (page: number) => string
}

/** The archive grid: category links, posts (the newest one larger on page one) and page links. */
export function NewsArchive({ categories, category, result, hrefFor }: NewsArchiveProps) {
  const { rows, page, pageCount, total } = result
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "News", href: "/news" },
    ...(category ? [{ label: category.name }] : []),
    ...(page > 1 ? [{ label: `Page ${page}` }] : []),
  ]

  return (
    <section className="py-10 sm:py-14">
      <Container className="space-y-8">
        <Breadcrumbs items={crumbs} />
        <NewsCategoryNav categories={categories} active={category?.slug} />

        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-carbon/20 px-6 py-16 text-center">
            <Newspaper className="mx-auto size-10 text-muted-foreground" aria-hidden />
            <p className="mt-4 font-display text-3xl font-bold uppercase">No posts yet</p>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {category ? `Nothing in ${category.name} yet. ` : ""}Race reports and team news will appear here soon.
            </p>
            {category && (
              <Button asChild variant="outline" className="mt-6">
                <Link href="/news">See all news</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {total} {total === 1 ? "post" : "posts"}
              {pageCount > 1 && ` · page ${page} of ${pageCount}`}
            </p>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {rows.map((post, index) => {
                const lead = page === 1 && index === 0
                return (
                  <li key={post.id} className={lead ? "sm:col-span-2 lg:row-span-2" : undefined}>
                    <NewsCard post={post} lead={lead} preload={index < 2} />
                  </li>
                )
              })}
            </ul>
            <NewsPagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
          </>
        )}
      </Container>
    </section>
  )
}
