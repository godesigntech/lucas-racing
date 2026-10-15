import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Container } from "@/components/layout/container"
import { ProductDetails } from "@/components/products/product-details"
import { ProductGrid } from "@/components/products/product-grid"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { SectionHeading } from "@/components/shared/section-heading"
import { HelmetStudio } from "@/components/studio/helmet-studio"
import { StudioHighlights } from "@/components/studio/studio-highlights"
import { Skeleton } from "@/components/ui/skeleton"
import { getPriceBook, getProductBySlug, getProducts, getRelatedProducts } from "@/lib/data/products"

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: "Design not found" }

  return {
    title: `${product.name} helmet design`,
    description: `${product.tagline} ${product.description}`,
    openGraph: {
      title: `${product.name} custom helmet`,
      description: product.tagline,
    },
  }
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      {params.then(({ slug }) => (
        <ProductContent slug={slug} />
      ))}
    </Suspense>
  )
}

function ProductSkeleton() {
  return (
    <Container className="space-y-8 pb-16 pt-8" aria-busy="true" aria-label="Loading design">
      <Skeleton className="h-5 w-48" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-8">
        <Skeleton className="aspect-[4/3] rounded-[1.75rem]" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-80 w-full rounded-[1.5rem]" />
        </div>
      </div>
    </Container>
  )
}

async function ProductContent({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [related, priceBook] = await Promise.all([getRelatedProducts(product), getPriceBook()])

  return (
    <>
      <section className="pb-12 pt-8 sm:pb-16">
        <Container className="space-y-6">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: product.name },
            ]}
          />
          <HelmetStudio product={product} priceBook={priceBook} />
        </Container>
      </section>

      <section className="pb-16 sm:pb-20">
        <Container className="space-y-10">
          <StudioHighlights />
          <div className="max-w-3xl space-y-3">
            <p className="eyebrow text-lime-ink">About this design</p>
            <p className="text-lg leading-relaxed text-carbon/80">{product.description}</p>
          </div>
          <ProductDetails product={product} />
        </Container>
      </section>

      {related.length > 0 && (
        <section className="py-16 sm:py-20">
          <Container className="space-y-10">
            <SectionHeading eyebrow="Keep looking" title="Related designs" />
            <ProductGrid products={related} />
          </Container>
        </section>
      )}
    </>
  )
}
