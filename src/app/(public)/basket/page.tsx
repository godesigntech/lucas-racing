import { Suspense } from "react"
import type { Metadata } from "next"

import { BasketView } from "@/components/basket/basket-view"
import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Skeleton } from "@/components/ui/skeleton"
import { getProductionAvailability } from "@/lib/data/production"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { getSiteSettings } from "@/lib/data/settings"

export const metadata: Metadata = {
  title: "Basket",
  description: "Review your basket before checkout.",
}

export default function BasketPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container className="space-y-10">
        <SectionHeading as="h1" eyebrow="Basket" title="Your basket" />
        <Suspense fallback={<Skeleton className="h-80 rounded-3xl" aria-label="Loading your basket" />}>
          <Basket />
        </Suspense>
      </Container>
    </section>
  )
}

/** Production dates are read live (they change as weeks fill), so they load inside Suspense. */
async function Basket() {
  const [products, priceBook, settings, weeks] = await Promise.all([
    getProducts(),
    getPriceBook(),
    getSiteSettings(),
    getProductionAvailability().catch(() => []),
  ])
  const startWeeks = weeks.filter((week) => week.isBookable).map((week) => week.weekStart)

  return <BasketView products={products} priceBook={priceBook} checkoutEnabled={settings.checkoutEnabled} startWeeks={startWeeks} partsDiscounts={settings.partsDiscounts} />
}
