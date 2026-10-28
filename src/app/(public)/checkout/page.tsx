import { Suspense } from "react"
import type { Metadata } from "next"

import { CheckoutForm } from "@/components/checkout/checkout-form"
import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Skeleton } from "@/components/ui/skeleton"
import { getMyProfile } from "@/lib/data/account"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { getProductionOptions } from "@/lib/data/production"
import { getSiteSettings } from "@/lib/data/settings"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
}

export default function CheckoutPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container className="space-y-10">
        <SectionHeading as="h1" eyebrow="Checkout" title="Place your order" />
        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutContent />
        </Suspense>
      </Container>
    </section>
  )
}

async function CheckoutContent() {
  const [profile, settings, products, priceBook, production] = await Promise.all([
    getMyProfile(),
    getSiteSettings(),
    getProducts(),
    getPriceBook(),
    getProductionOptions(),
  ])

  return (
    <CheckoutForm
      profile={profile}
      deliveryMethods={settings.deliveryMethods.filter((method) => method.active)}
      products={products}
      priceBook={priceBook}
      production={production}
    />
  )
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]" aria-busy="true" aria-label="Loading checkout">
      <div className="space-y-5">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  )
}
