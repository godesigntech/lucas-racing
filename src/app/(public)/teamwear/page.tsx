import { Suspense } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Heart, MessageCircle } from "lucide-react"

import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { ShopResults } from "@/components/shop/shop-results"
import { ShopToolbar } from "@/components/shop/shop-toolbar"
import { StoreCategoryNav } from "@/components/shop/store-category-nav"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"
import { getShopCategories } from "@/lib/data/shop"
import { categoryWithChildren, listShopProducts } from "@/lib/data/shop-listing"
import { readShopQuery, shopPageHref, type ShopSearchParams } from "@/lib/shop/shop-query"

export const metadata: Metadata = {
  title: "Wendy's Teamwear",
  description: "Lucas Racing hoodies, sweatshirts, T-shirts, polo shirts, caps and accessories, looked after by Wendy.",
}

/** Wendy's Teamwear: the team's own kit, sold through the shared basket and checkout. */
export default function TeamwearPage({ searchParams }: PageProps<"/teamwear">) {
  return (
    <>
      <PageHero
        eyebrow="Wendy's Teamwear"
        title={
          <>
            Wear the
            <span className="block text-brand">team colours</span>
          </>
        }
        description="Lucas Racing hoodies, sweatshirts, T-shirts, polo shirts, caps and accessories, looked after by Wendy."
        image={images.wendy}
        logo={brandLogos.lucasRacing}
      />
      <section className="py-12 sm:py-16">
        <Container className="space-y-6">
          <Suspense fallback={<Skeleton className="h-[30rem] rounded-3xl" />}>
            {searchParams.then((params) => (
              <Range params={params} />
            ))}
          </Suspense>
        </Container>
      </section>
      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="reveal grid overflow-hidden rounded-[2rem] bg-carbon text-paper lg:grid-cols-2">
            <div className="relative min-h-64">
              <Image src={images.teamPhoto.src} alt={images.teamPhoto.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="space-y-4 p-8 sm:p-12">
              <p className="eyebrow inline-flex items-center gap-2 text-brand">
                <Heart className="size-4" aria-hidden /> From Wendy
              </p>
              <h2 className="display text-4xl sm:text-5xl">Part of the family</h2>
              <p className="leading-relaxed text-paper/75">
                Teamwear is how drivers, parents and friends show they&apos;re part of Lucas Racing, in the paddock and away from it. Need a
                size, a colour or something for the whole family? Just ask.
              </p>
              <Button asChild variant="inverse">
                <Link href="/contact?message=Hi%20Wendy%2C%20I%27m%20asking%20about%20teamwear%3A%20">
                  <MessageCircle /> Ask Wendy
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

async function Range({ params }: { params: ShopSearchParams }) {
  const categories = await getShopCategories("teamwear")
  const slug = typeof params.category === "string" ? params.category : undefined
  const category = slug ? categories.find((item) => item.slug === slug) : undefined
  const { filtered, ...query } = readShopQuery(params)
  const result = await listShopProducts({ ...query, store: "teamwear", categoryIds: category ? categoryWithChildren(categories, category) : undefined })
  const empty = result.total === 0 && !filtered && !category

  if (empty) {
    return (
      <div className="flex flex-col items-center rounded-[2rem] bg-[radial-gradient(circle_at_50%_0%,#fde3d6,#f4f3ee_70%)] px-6 py-16 text-center">
        <Image src={brandLogos.lucasRacing.src} alt={brandLogos.lucasRacing.alt} width={brandLogos.lucasRacing.width} height={brandLogos.lucasRacing.height} className="h-14 w-auto" />
        <h2 className="mt-6 font-display text-4xl font-bold uppercase">New teamwear coming soon</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Wendy is getting the new range ready: hoodies, T-shirts, polos, caps and more. Want something now? Get in touch.
        </p>
        <Button asChild className="mt-6">
          <Link href="/contact?message=Hi%20Wendy%2C%20I%27m%20asking%20about%20teamwear%3A%20">
            <MessageCircle /> Ask about teamwear
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <StoreCategoryNav categories={categories} active={category?.slug} basePath="/teamwear" label="Teamwear categories" />
      <Suspense fallback={<Skeleton className="h-24 rounded-3xl" />}>
        <ShopToolbar />
      </Suspense>
      <ShopResults
        result={result}
        filtered={filtered || Boolean(category)}
        pageHref={(page) => shopPageHref("/teamwear", params, page)}
        enquiry={{ label: "Ask Wendy", message: "Hi Wendy, I'm asking about teamwear: " }}
      />
    </>
  )
}
