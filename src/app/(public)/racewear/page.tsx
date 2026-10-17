import { Suspense } from "react"
import type { Metadata } from "next"
import { ExternalLink, MousePointerClick, Ruler, Shirt } from "lucide-react"

import { Container } from "@/components/layout/container"
import { CtaBand } from "@/components/shared/cta-band"
import { PageHero } from "@/components/shared/page-hero"
import { SectionHeading } from "@/components/shared/section-heading"
import { ShopResults } from "@/components/shop/shop-results"
import { ShopToolbar } from "@/components/shop/shop-toolbar"
import { StoreCategoryNav } from "@/components/shop/store-category-nav"
import { Skeleton } from "@/components/ui/skeleton"
import { images } from "@/constants/images"
import { getShopCategories } from "@/lib/data/shop"
import { categoryWithChildren, listShopProducts } from "@/lib/data/shop-listing"
import { readShopQuery, shopPageHref, type ShopSearchParams } from "@/lib/shop/shop-query"

export const metadata: Metadata = {
  title: "Delta Racewear",
  description: "Custom Delta Racewear race suits, available through Lucas Racing. Browse the range, then customise and order your suit with Delta.",
}

const steps = [
  { icon: Shirt, title: "Browse the range", text: "Find the suit, gloves or accessories you like here." },
  { icon: MousePointerClick, title: "Customise at Delta", text: "Choose your colours and design on Delta Racewear's own site." },
  { icon: Ruler, title: "Ask us about sizing", text: "Not sure which suit or size? The Lucas Racing team is happy to help." },
]

// Browse-only: suits are customised and ordered on Delta's site, so there's no basket here.
// The Delta logo isn't shown until the client supplies it with permission to use it.
export default function RacewearPage({ searchParams }: PageProps<"/racewear">) {
  return (
    <>
      <PageHero
        eyebrow="Delta Racewear"
        title={
          <>
            Delta Racewear
            <span className="block text-brand">Available through Lucas Racing</span>
          </>
        }
        description="Custom race suits from our partners at Delta Racewear. Browse the range here, then design and order your suit with Delta."
        image={images.fatherAndSonPaddock}
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
      <section className="grid-texture bg-carbon py-16 text-paper sm:py-20">
        <Container className="space-y-10">
          <SectionHeading tone="light" eyebrow="How it works" title="Your suit, made by Delta" />
          <ol className="grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }) => (
              <li key={title} className="reveal rounded-3xl border border-white/10 bg-white/5 p-6">
                <span className="grid size-11 place-items-center rounded-full bg-brand text-carbon">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-2xl font-bold uppercase">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{text}</p>
              </li>
            ))}
          </ol>
          <p className="flex items-center gap-2 text-sm text-paper/60">
            <ExternalLink className="size-4" aria-hidden /> Orders and payment for suits are handled by Delta Racewear.
          </p>
        </Container>
      </section>
      <CtaBand
        eyebrow="Need advice?"
        title="Not sure which suit to choose?"
        description="Tell us how and where you race and we'll point you to the right Delta suit and size."
        primary={{ label: "Ask about a suit", href: "/contact?message=Hi%2C%20I%27m%20interested%20in%20a%20Delta%20Racewear%20suit.%20" }}
        image={images.teamPhoto}
      />
    </>
  )
}

async function Range({ params }: { params: ShopSearchParams }) {
  const categories = await getShopCategories("delta")
  const slug = typeof params.category === "string" ? params.category : undefined
  const category = slug ? categories.find((item) => item.slug === slug) : undefined
  const { filtered, ...query } = readShopQuery(params)
  const result = await listShopProducts({ ...query, inStock: false, store: "delta", categoryIds: category ? categoryWithChildren(categories, category) : undefined })

  return (
    <>
      <StoreCategoryNav categories={categories} active={category?.slug} basePath="/racewear" label="Racewear categories" />
      {(result.total > 0 || filtered || category) && (
        <Suspense fallback={<Skeleton className="h-24 rounded-3xl" />}>
          <ShopToolbar showStock={false} />
        </Suspense>
      )}
      <ShopResults
        result={result}
        filtered={filtered || Boolean(category)}
        pageHref={(page) => shopPageHref("/racewear", params, page)}
        emptyTitle="Delta suits coming soon"
        emptyDescription="We're adding the Delta Racewear range now. Ask us about suits, sizes and colours in the meantime."
        enquiry={{ label: "Ask about a Delta suit", message: "Hi, I'm interested in a Delta Racewear suit. " }}
      />
    </>
  )
}
