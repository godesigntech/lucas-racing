import type { Metadata } from "next"

import { BasketView } from "@/components/basket/basket-view"
import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { getPriceBook, getProducts } from "@/lib/data/products"

export const metadata: Metadata = {
  title: "Basket",
  description: "Review your custom helmets before checkout.",
}

export default async function BasketPage() {
  const [products, priceBook] = await Promise.all([getProducts(), getPriceBook()])

  return (
    <section className="py-12 sm:py-16">
      <Container className="space-y-10">
        <SectionHeading as="h1" eyebrow="Basket" title="Your helmets" />
        <BasketView products={products} priceBook={priceBook} />
      </Container>
    </section>
  )
}
