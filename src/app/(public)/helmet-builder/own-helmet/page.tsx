import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { HelmetBuilder } from "@/components/builder/helmet-builder"
import { Container } from "@/components/layout/container"
import { OwnHelmetForm } from "@/components/own-helmet/own-helmet-form"
import { SectionHeading } from "@/components/shared/section-heading"
import { Skeleton } from "@/components/ui/skeleton"
import { requireUser } from "@/lib/auth/session"
import { pickableFilms } from "@/lib/configurator/helmet-configuration"
import { getMyProfile } from "@/lib/data/account"
import { getBuilderCatalog } from "@/lib/data/builder"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { kitsWithoutPrices, withoutPrices } from "@/lib/configurator/without-prices"
import { DESIGN_SKETCH_ID } from "@/lib/own-helmet/design-reference"

export const metadata: Metadata = {
  title: "Customise your own helmet",
  description: "Send us photos of your own helmet and tell us the design you'd like. We'll come back to you with a quote.",
}

export default function OwnHelmetPage() {
  return (
    <section className="space-y-8 py-12 sm:py-16">
      <Container className="max-w-4xl space-y-8">
        <Link href="/helmet-builder" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-carbon">
          <ArrowLeft className="size-4" aria-hidden /> Back to the helmet builder
        </Link>
        <SectionHeading
          as="h1"
          eyebrow="Send my own helmet"
          title="Customise your own helmet"
          description="Show us your helmet and describe the design you'd like. We'll check it's suitable and send you a quote before any work starts."
        />
      </Container>
      <Suspense fallback={<FormSkeleton />}>
        <OwnHelmetContent />
      </Suspense>
    </section>
  )
}

async function OwnHelmetContent() {
  // A request needs an account (and a complete profile, asked for on the form).
  await requireUser("/helmet-builder/own-helmet")
  const [profile, priceBook, products, builder] = await Promise.all([getMyProfile(), getPriceBook(), getProducts(), getBuilderCatalog()])
  return (
    <div className="space-y-8">
      {/* A 3D sketch pad, only for showing us the idea: no helmet choice, prices or basket. */}
      <Container id={DESIGN_SKETCH_ID} className="scroll-mt-24 space-y-4 max-sm:px-3">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-bold uppercase leading-tight">Sketch your design in 3D</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional. Play with templates, colours, films and text to show us the look you&apos;re after. We send it with your request as a reference;
            it doesn&apos;t need to match your helmet exactly.
          </p>
        </div>
        <HelmetBuilder
          sketch
          products={products}
          priceBook={withoutPrices(priceBook)}
          templates={builder.templates}
          aeroKits={kitsWithoutPrices(builder.aeroKits)}
          visors={kitsWithoutPrices(builder.visors)}
        />
      </Container>
      <Container className="max-w-4xl">
        <OwnHelmetForm profile={profile} films={pickableFilms(priceBook)} />
      </Container>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading the form">
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-56 rounded-3xl" />
      <Skeleton className="h-56 rounded-3xl" />
    </div>
  )
}
