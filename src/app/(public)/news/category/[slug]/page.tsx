import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NewsArchive } from "@/components/news/news-archive"
import { NewsArchiveSkeleton } from "@/components/news/news-archive-skeleton"
import { PageHero } from "@/components/shared/page-hero"
import { images } from "@/constants/images"
import { getNewsCategories, listNews } from "@/lib/data/news"

const pageFrom = (value: string | string[] | undefined) => Math.max(1, Number.parseInt(String(value ?? "1"), 10) || 1)
const hrefFor = (slug: string) => (page: number) => (page > 1 ? `/news/category/${slug}?page=${page}` : `/news/category/${slug}`)

export async function generateMetadata({ params, searchParams }: PageProps<"/news/category/[slug]">): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const category = (await getNewsCategories()).find((item) => item.slug === slug)
  if (!category) return { title: "Category not found" }
  const page = pageFrom(query.page)
  const title = page > 1 ? `${category.name}, page ${page}` : category.name
  return {
    title: `${title} | News`,
    description: category.description || `${category.name} from Lucas Racing.`,
    alternates: { canonical: hrefFor(slug)(page) },
    openGraph: { title: `${title} | Lucas Racing news`, url: hrefFor(slug)(page), type: "website" },
  }
}

export default function NewsCategoryPage({ params, searchParams }: PageProps<"/news/category/[slug]">) {
  return (
    <Suspense fallback={<NewsArchiveSkeleton />}>
      {Promise.all([params, searchParams]).then(([{ slug }, { page }]) => (
        <CategoryArchive slug={slug} page={pageFrom(page)} />
      ))}
    </Suspense>
  )
}

async function CategoryArchive({ slug, page }: { slug: string; page: number }) {
  const categories = await getNewsCategories()
  const category = categories.find((item) => item.slug === slug)
  if (!category) notFound()
  const result = await listNews({ categoryId: category.id, page })
  if (page > 1 && page > result.pageCount) notFound()

  return (
    <>
      <PageHero eyebrow="News and results" title={category.name} description={category.description || undefined} image={images.fatherAndSon} />
      <NewsArchive categories={categories} category={category} result={result} hrefFor={hrefFor(slug)} />
    </>
  )
}
