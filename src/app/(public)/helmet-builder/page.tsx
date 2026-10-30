import { Suspense } from "react"
import type { Metadata } from "next"

import { HelmetBuilder } from "@/components/builder/helmet-builder"
import { Container } from "@/components/layout/container"
import { StudioHighlights } from "@/components/studio/studio-highlights"
import { Skeleton } from "@/components/ui/skeleton"
import { getBuilderCatalog } from "@/lib/data/builder"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { getProductionOptions } from "@/lib/data/production"

export const metadata: Metadata = {
  title: "Helmet builder",
  description:
    "Design your custom Arai SK-6 or Bell KC7 helmet: choose a template, colour every part with paint, hydro-dip film or chrome, pick the finish, add your name, number and logo.",
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default function HelmetBuilderPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section className="py-5 sm:py-10">
      <Container className="space-y-10 max-sm:px-3">
        <Suspense fallback={<BuilderSkeleton />}>
          <Builder searchParams={searchParams} />
        </Suspense>
        <StudioHighlights />
      </Container>
    </section>
  )
}

async function Builder({ searchParams }: { searchParams: SearchParams }) {
  const [products, priceBook, builder, production, query] = await Promise.all([
    getProducts(),
    getPriceBook(),
    getBuilderCatalog(),
    getProductionOptions(),
    searchParams,
  ])
  // Lets the first paint open on the right template instead of flashing the default.
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) if (typeof value === "string") search.set(key, value)
  const initialSearch = search.size ? `?${search}` : ""
  return (
    <HelmetBuilder
      products={products}
      priceBook={priceBook}
      templates={builder.templates}
      aeroKits={builder.aeroKits}
      visors={builder.visors}
      production={production}
      initialSearch={initialSearch}
    />
  )
}

function BuilderSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8" aria-busy="true" aria-label="Loading the helmet builder">
      <Skeleton className="aspect-[4/3] rounded-[1.75rem]" />
      <Skeleton className="h-[32rem] rounded-[1.75rem]" />
    </div>
  )
}
