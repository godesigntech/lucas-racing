import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { ProductDetails } from "@/components/products/product-details"
import { ProductGallery } from "@/components/products/product-gallery"
import { ProductGrid } from "@/components/products/product-grid"
import { ProductSummary } from "@/components/products/product-summary"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/data/products"

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
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-[4/3] rounded-[2rem]" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </Container>
  )
}

async function ProductContent({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)

  return (
    <>
      <section className="pb-16 pt-8 sm:pb-20">
        <Container className="space-y-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: product.name },
            ]}
          />
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ProductGallery look={product.look} name={product.name} />
            <ProductSummary product={product} />
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-20">
        <Container>
          <ProductDetails product={product} />
        </Container>
      </section>

      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="grid-texture relative flex flex-col gap-6 overflow-hidden rounded-[2rem] bg-carbon p-6 text-paper sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-3">
              <p className="eyebrow text-lime">Design studio</p>
              <h2 className="display text-4xl sm:text-5xl">Make {product.name} yours</h2>
              <p className="text-paper/70">
                Pick your shell, finish, colours, film and trims step by step. The preview and price update as you go.
              </p>
            </div>
            <Button asChild size="lg" className="self-start md:self-auto">
              <Link href={`/products/${product.slug}/customize`}>
                Open the design studio <ArrowRight />
              </Link>
            </Button>
          </div>
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
