import { Suspense } from "react"
import type { Metadata } from "next"

import { Container } from "@/components/layout/container"
import { ProductBrowser } from "@/components/products/product-browser"
import { ProductBrowserSkeleton } from "@/components/products/product-browser-skeleton"
import { PageHero } from "@/components/shared/page-hero"
import { getHelmetModels, getProductCategories, getProducts } from "@/lib/data/products"

export const metadata: Metadata = {
  title: "Helmet designs",
  description:
    "Browse custom helmet designs for the Arai SK-6 and Bell KC7: racing lines, hydro-dip films, chrome and bespoke work.",
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getProductCategories()])
  const models = getHelmetModels()

  return (
    <>
      <PageHero
        eyebrow="Products"
        title="Helmet designs"
        description="Every design is a starting point. Pick a layout, then make it yours with colours, films, trims and your race number."
      />
      <section className="py-12 sm:py-16">
        <Container>
          <Suspense fallback={<ProductBrowserSkeleton count={products.length} />}>
            <ProductBrowser products={products} categories={categories} models={models} />
          </Suspense>
          <p className="mt-10 text-center font-mono text-xs text-muted-foreground">
            Sample designs and pricing. Prices cover the customisation; the helmet itself is quoted separately.
          </p>
        </Container>
      </section>
    </>
  )
}
