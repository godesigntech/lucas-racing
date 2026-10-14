import { Suspense } from "react"
import type { Metadata } from "next"

import { Container } from "@/components/layout/container"
import { ProductBrowser } from "@/components/products/product-browser"
import { ProductBrowserSkeleton } from "@/components/products/product-browser-skeleton"
import { PageHero } from "@/components/shared/page-hero"
import { images } from "@/constants/images"
import { getPriceBook, getProductCategories, getProducts } from "@/lib/data/products"

export const metadata: Metadata = {
  title: "Helmet designs",
  description:
    "Browse custom helmet designs for the Arai SK-6 and Bell KC7: racing lines, hydro-dip films, chrome and bespoke work.",
}

export default async function ProductsPage() {
  const [products, categories, priceBook] = await Promise.all([getProducts(), getProductCategories(), getPriceBook()])

  return (
    <>
      <PageHero
        eyebrow="Products"
        title="Helmet designs"
        description="Every design is a starting point. Pick a layout, then make it yours with colours, films, trims and your race number."
        image={images.pack}
      />
      <section className="py-12 sm:py-16">
        <Container>
          <Suspense fallback={<ProductBrowserSkeleton count={products.length} />}>
            <ProductBrowser products={products} categories={categories} models={priceBook.models} />
          </Suspense>
          <p className="mt-10 text-center font-mono text-xs text-muted-foreground">
            Prices cover the design and finishing. A new helmet, chrome and extras are added in the configurator.
          </p>
        </Container>
      </section>
    </>
  )
}
