import { Suspense } from "react"
import type { Metadata } from "next"

import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { SectionHeading } from "@/components/shared/section-heading"
import { CategoryTiles } from "@/components/shop/category-tiles"
import { ShopProductCard } from "@/components/shop/shop-product-card"
import { ShopResults } from "@/components/shop/shop-results"
import { ShopToolbar } from "@/components/shop/shop-toolbar"
import { Skeleton } from "@/components/ui/skeleton"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"
import { getShopCategories } from "@/lib/data/shop"
import { getFeaturedShopProducts, listShopProducts } from "@/lib/data/shop-listing"
import { readShopQuery, shopPageHref, type ShopSearchParams } from "@/lib/shop/shop-query"

export const metadata: Metadata = {
  title: "MS Kart shop",
  description:
    "Complete MS Kart karts, chassis, components, spares and accessories from Lucas Racing, the UK distributor of MS Kart since 1999.",
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const categories = (await getShopCategories("ms-kart")).filter((category) => !category.parentId)

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
            <Featured />
          </Suspense>
          <div className="space-y-6">
            <SectionHeading eyebrow="Shop all" title="Karts, parts and accessories" />
            <Suspense fallback={<Skeleton className="h-24 rounded-3xl" />}>
              <ShopToolbar />
            </Suspense>
            <Suspense fallback={<GridSkeleton />}>
              {searchParams.then((params) => (
                <Results params={params} />
              ))}
            </Suspense>
          </div>
        </Container>
      </section>
    </>
  )
}

async function Featured() {
  const featured = await getFeaturedShopProducts("ms-kart", 4)
  if (featured.length === 0) return null
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Featured" title="Picked by the team" />
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        {featured.map((item) => (
          <li key={item.id}>
            <ShopProductCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}

async function Results({ params }: { params: ShopSearchParams }) {
  const { filtered, ...query } = readShopQuery(params)
  const result = await listShopProducts({ ...query, store: "ms-kart" })
  return <ShopResults result={result} filtered={filtered} pageHref={(page) => shopPageHref("/shop", params, page)} />
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
