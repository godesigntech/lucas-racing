import { Suspense } from "react"
import type { Metadata } from "next"

import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { SectionHeading } from "@/components/shared/section-heading"
import { CategoryTiles } from "@/components/shop/category-tiles"
import { ShopCategoryFilter } from "@/components/shop/shop-category-filter"
import { ShopProductCard } from "@/components/shop/shop-product-card"
import { ShopResults } from "@/components/shop/shop-results"
import { ShopToolbar } from "@/components/shop/shop-toolbar"
import { Skeleton } from "@/components/ui/skeleton"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"
import { getShopCategories } from "@/lib/data/shop"
import { categoryWithChildren, getFeaturedShopProducts, listShopProducts } from "@/lib/data/shop-listing"
import { readShopQuery, shopPageHref, type ShopSearchParams } from "@/lib/shop/shop-query"
import type { ShopCategory } from "@/types/shop"

export const metadata: Metadata = {
  title: "MS Kart shop",
  description:
    "Complete MS Kart karts, chassis, components, spares and accessories from Lucas Racing, the UK distributor of MS Kart since 1999.",
}

/** The category a section's chips point at, plus its subcategories. Empty when none is chosen. */
function chosenCategory(categories: ShopCategory[], slug: string | undefined) {
  const category = slug ? categories.find((candidate) => candidate.slug === slug) : undefined
  return { category, ids: category ? categoryWithChildren(categories, category) : undefined }
}

const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const allCategories = await getShopCategories("ms-kart")
  const categories = allCategories.filter((category) => !category.parentId)

  return (
    <>
      <PageHero
        eyebrow="MS Kart shop"
        title="The UK home of MS Kart"
        description="Complete karts, chassis, genuine parts and spares, from the team that has raced and supported MS Kart since 1999."
        image={images.teamAwning}
        logo={brandLogos.msKart}
      />
      <section className="py-12 sm:py-16">
        <Container className="space-y-14">
          <CategoryTiles categories={categories} basePath="/shop" />
          <Suspense fallback={null}>
            {searchParams.then((params) => (
              <Featured categories={allCategories} params={params} />
            ))}
          </Suspense>
          <div className="space-y-6">
            <SectionHeading eyebrow="Shop all" title="Karts, parts and accessories" />
            <Suspense fallback={<Skeleton className="h-9 w-full max-w-xl rounded-full" />}>
              {searchParams.then((params) => (
                <ShopCategoryFilter
                  categories={allCategories}
                  active={firstParam(params.category)}
                  param="category"
                  pathname="/shop"
                  params={params}
                  label="Filter all products by category"
                />
              ))}
            </Suspense>
            <Suspense fallback={<Skeleton className="h-24 rounded-3xl" />}>
              <ShopToolbar />
            </Suspense>
            <Suspense fallback={<GridSkeleton />}>
              {searchParams.then((params) => (
                <Results categories={allCategories} params={params} />
              ))}
            </Suspense>
          </div>
        </Container>
      </section>
    </>
  )
}

async function Featured({ categories, params }: { categories: ShopCategory[]; params: ShopSearchParams }) {
  const { category, ids } = chosenCategory(categories, firstParam(params.featured))
  const featured = await getFeaturedShopProducts("ms-kart", 4, ids)
  // With no featured products at all, the section stays hidden; a category with none says so.
  if (featured.length === 0 && !category) return null
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Featured" title="Picked by the team" />
      <ShopCategoryFilter
        categories={categories}
        active={category?.slug}
        param="featured"
        pathname="/shop"
        params={params}
        label="Filter featured products by category"
      />
      {featured.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {featured.map((item) => (
            <li key={item.id}>
              <ShopProductCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-3xl border border-dashed border-carbon/15 px-6 py-10 text-center text-sm text-muted-foreground">
          No featured {category?.name.toLowerCase()} right now. Browse them all below.
        </p>
      )}
    </div>
  )
}

async function Results({ categories, params }: { categories: ShopCategory[]; params: ShopSearchParams }) {
  const { filtered, ...query } = readShopQuery(params)
  const { category, ids } = chosenCategory(categories, firstParam(params.category))
  const result = await listShopProducts({ ...query, categoryIds: ids, store: "ms-kart" })
  return (
    <ShopResults result={result} filtered={filtered || Boolean(category)} pageHref={(page) => shopPageHref("/shop", params, page)} />
  )
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index}>
          <Skeleton className="aspect-[3/4] rounded-3xl" />
        </li>
      ))}
    </ul>
  )
}
