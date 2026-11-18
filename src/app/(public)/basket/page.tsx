import type { Metadata } from "next"

import { BasketView } from "@/components/basket/basket-view"
import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { getSiteSettings } from "@/lib/data/settings"

export const metadata: Metadata = {
  title: "Basket",
  description: "Review your basket before checkout.",
}

export default async function BasketPage() {
  const [products, priceBook, settings] = await Promise.all([getProducts(), getPriceBook(), getSiteSettings()])

  return (
    <section className="py-12 sm:py-16">
      <Container className="space-y-10">
        <SectionHeading as="h1" eyebrow="Basket" title="Your basket" />
        <BasketView products={products} priceBook={priceBook} checkoutEnabled={settings.checkoutEnabled} />
      </Container>
    </section>
  )
}
