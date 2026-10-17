import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NewsArchive } from "@/components/news/news-archive"
import { NewsArchiveSkeleton } from "@/components/news/news-archive-skeleton"
import { NewsComingSoon } from "@/components/news/news-coming-soon"
import { PageHero } from "@/components/shared/page-hero"
import { images } from "@/constants/images"
import { getNewsCategories, listNews } from "@/lib/data/news"
import { getSiteSettings } from "@/lib/data/settings"

const pageFrom = (value: string | string[] | undefined) => Math.max(1, Number.parseInt(String(value ?? "1"), 10) || 1)
const hrefFor = (page: number) => (page > 1 ? `/news?page=${page}` : "/news")

export async function generateMetadata({ searchParams }: PageProps<"/news">): Promise<Metadata> {
  const page = pageFrom((await searchParams).page)
  const title = page > 1 ? `News and results, page ${page}` : "News and results"
  return {
    title,
    description: "Race reports, results and team news from Lucas Racing, the family-run kart racing team and UK home of MS Kart.",
    alternates: { canonical: hrefFor(page), types: { "application/rss+xml": "/news/feed.xml" } },
    openGraph: { title: `${title} | Lucas Racing`, url: hrefFor(page), type: "website" },
  }
}

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  if (!(await getSiteSettings()).showNews) return <NewsComingSoon />
  return (
    <>
      <PageHero
        eyebrow="News and results"
        title="From the paddock"
        description="Race weekend reports, results and news from the Lucas Racing team."
        image={images.fatherAndSon}
      />
      <Suspense fallback={<NewsArchiveSkeleton />}>
        {searchParams.then(({ page }) => (
          <Archive page={pageFrom(page)} />
        ))}
      </Suspense>
    </>
  )
}

async function Archive({ page }: { page: number }) {
  const [categories, result] = await Promise.all([getNewsCategories(), listNews({ page })])
  if (page > 1 && page > result.pageCount) notFound()
  return <NewsArchive categories={categories} result={result} hrefFor={hrefFor} />
}
