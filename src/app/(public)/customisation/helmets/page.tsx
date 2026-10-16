import { Suspense } from "react"
import type { Metadata } from "next"

import { Benefits } from "@/components/customisation/benefits"
import { FilmTicker } from "@/components/customisation/film-ticker"
import { ProcessSteps } from "@/components/customisation/process-steps"
import { WhyChooseUs } from "@/components/customisation/why-choose-us"
import { Container } from "@/components/layout/container"
import { ProductBrowser } from "@/components/products/product-browser"
import { ProductBrowserSkeleton } from "@/components/products/product-browser-skeleton"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { CtaBand } from "@/components/shared/cta-band"
import { PageHero } from "@/components/shared/page-hero"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"
import { getPriceBook, getProductCategories, getProducts } from "@/lib/data/products"

export const metadata: Metadata = {
  title: "Custom helmets by HydroKarts",
  description:
    "Custom Arai SK-6 and Bell KC7 kart helmets by HydroKarts for Lucas Racing: racing-line designs, hydro-dip films, chrome and bespoke work.",
}

export default async function CustomHelmetsPage() {
  const [products, categories, priceBook] = await Promise.all([getProducts(), getProductCategories(), getPriceBook()])

  return (
    <>
      <PageHero
        eyebrow="Customisation by HydroKarts"
        title="Custom helmets"
        description="Every design is a starting point. Pick a layout, then make it yours with colours, hydro-dip films, chrome, trims and your race number."
        image={images.fatherAndSonPaddock}
        logo={brandLogos.lucasRacingByHydroKarts}
      />
      <FilmTicker />
      <section className="py-12 sm:py-16">
        <Container className="space-y-8">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Customisation", href: "/customisation" }, { label: "Helmets" }]} />
          <Suspense fallback={<ProductBrowserSkeleton count={products.length} />}>
            <ProductBrowser products={products} categories={categories} models={priceBook.models} />
          </Suspense>
          <p className="text-center font-mono text-xs text-muted-foreground">
            Prices cover the design and finishing. A new helmet, chrome and extras are added in the configurator.
          </p>
        </Container>
      </section>
      <Benefits />
      <WhyChooseUs />
      <ProcessSteps />
      <CtaBand
        eyebrow="Your helmet, your colours"
        title="Ready to put your name on the grid?"
        description="Pick a design to start from, or tell us what you have in mind. We'll send a proof before anything is painted."
        primary={{ label: "Open the helmet builder", href: "/helmet-builder" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
        image={images.connorCoaching}
      />
    </>
  )
}
