import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Container } from "@/components/layout/container"
import { HelmetStudio } from "@/components/studio/helmet-studio"
import { StudioHighlights } from "@/components/studio/studio-highlights"
import { Skeleton } from "@/components/ui/skeleton"
import { getPriceBook, getProductBySlug, getProducts } from "@/lib/data/products"

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]/customize">): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  return product
    ? { title: `Customise ${product.name}`, description: `Design your ${product.name} helmet: shell, finish, colours, film and trims.` }
    : { title: "Design not found" }
}

export default function CustomizePage({ params }: PageProps<"/products/[slug]/customize">) {
  return (
    <section className="py-8 sm:py-12">
      <Container className="space-y-12">
        <Suspense fallback={<StudioSkeleton />}>
          {params.then(({ slug }) => (
            <Studio slug={slug} />
          ))}
        </Suspense>
        <StudioHighlights />
      </Container>
    </section>
  )
}

async function Studio({ slug }: { slug: string }) {
  const [product, priceBook] = await Promise.all([getProductBySlug(slug), getPriceBook()])
  if (!product) notFound()
  return <HelmetStudio product={product} priceBook={priceBook} />
}

function StudioSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading the design studio">
      <div className="space-y-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-14 w-full max-w-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Skeleton className="aspect-[4/3] rounded-[1.75rem]" />
        <Skeleton className="h-[34rem] rounded-[1.75rem]" />
      </div>
    </div>
  )
}
