import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { ShopResults } from "@/components/shop/shop-results"
import { ShopToolbar } from "@/components/shop/shop-toolbar"
import { Skeleton } from "@/components/ui/skeleton"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"
import { getShopCategories } from "@/lib/data/shop"
import { categoryWithChildren, listShopProducts } from "@/lib/data/shop-listing"
import { readShopQuery, shopPageHref, type ShopSearchParams } from "@/lib/shop/shop-query"
import { cn } from "@/lib/utils"

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const slug = (await params).category
  const category = (await getShopCategories("ms-kart")).find((candidate) => candidate.slug === slug)
  return category
    ? { title: `${category.name} | MS Kart shop`, description: category.description || `${category.name} from the Lucas Racing MS Kart shop.` }
    : {}
}

export default function ShopCategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      {Promise.all([params, searchParams]).then(([{ category }, query]) => (
        <CategoryView slug={category} params={query} />
      ))}
    </Suspense>
  )
}

async function CategoryView({ slug, params }: { slug: string; params: ShopSearchParams }) {
  const categories = await getShopCategories("ms-kart")
  const category = categories.find((candidate) => candidate.slug === slug)
  if (!category) notFound()

  const parent = category.parentId ? categories.find((candidate) => candidate.id === category.parentId) : undefined
  const children = categories.filter((candidate) => candidate.parentId === category.id)
  const siblings = categories.filter((candidate) => !candidate.parentId)
  const path = `/shop/${category.slug}`

  return (
    <>
      <PageHero
        eyebrow={parent ? `MS Kart shop · ${parent.name}` : "MS Kart shop"}
        title={category.name}
        description={category.description || undefined}
        image={images.connor}
        logo={brandLogos.msKart}
      />
      <section className="py-12 sm:py-16">
        <Container className="space-y-6">
          <nav aria-label="Shop categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex gap-2">
              <li className="shrink-0">
                <Link href="/shop" className="inline-flex h-9 items-center rounded-full border border-carbon/15 bg-card px-4 text-sm font-medium hover:border-carbon/40">
                  All
                </Link>
              </li>
              {(children.length ? children : siblings).map((item) => (
                <li key={item.id} className="shrink-0">
                  <Link
                    href={`/shop/${item.slug}`}
                    aria-current={item.id === category.id ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium",
                      item.id === category.id ? "border-carbon bg-carbon text-paper" : "border-carbon/15 bg-card hover:border-carbon/40",
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Suspense fallback={<Skeleton className="h-24 rounded-3xl" />}>
            <ShopToolbar />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
            <Results categoryIds={categoryWithChildren(categories, category)} params={params} path={path} />
          </Suspense>
        </Container>
      </section>
    </>
  )
}

async function Results({ categoryIds, params, path }: { categoryIds: string[]; params: ShopSearchParams; path: string }) {
  const { filtered, ...query } = readShopQuery(params)
  const result = await listShopProducts({ ...query, store: "ms-kart", categoryIds })
  return <ShopResults result={result} filtered={filtered} pageHref={(page) => shopPageHref(path, params, page)} />
}
