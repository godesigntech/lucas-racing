import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"

import { CheckoutForm } from "@/components/checkout/checkout-form"
import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
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

  // Switched off in Admin > Settings > Launches: the basket asks for a quote instead.
  if (!settings.checkoutEnabled) {
    return (
      <div className="max-w-xl space-y-4 rounded-3xl border border-carbon/10 bg-card p-6">
        <p className="font-display text-3xl font-bold uppercase">Not taking orders online yet</p>
        <p className="text-muted-foreground">
          We&apos;re finishing the last checks before orders open. Send us your basket from the basket page and we&apos;ll reply with a quote.
        </p>
        <Button asChild>
          <Link href="/basket">Back to your basket</Link>
        </Button>
      </div>
    )
  }

  return (
    <CheckoutForm
      profile={profile}
      deliveryMethods={settings.deliveryMethods.filter((method) => method.active)}
      products={products}
      priceBook={priceBook}
      production={production}
      partsDiscounts={settings.partsDiscounts}
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
