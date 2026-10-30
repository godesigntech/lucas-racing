import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Container } from "@/components/layout/container"
import { OwnHelmetForm } from "@/components/own-helmet/own-helmet-form"
import { SectionHeading } from "@/components/shared/section-heading"
import { Skeleton } from "@/components/ui/skeleton"
import { requireUser } from "@/lib/auth/session"
import { pickableFilms } from "@/lib/configurator/helmet-configuration"
import { getMyProfile } from "@/lib/data/account"
import { getPriceBook } from "@/lib/data/products"

export const metadata: Metadata = {
  title: "Customise your own helmet",
  description: "Send us photos of your own helmet and tell us the design you'd like. We'll come back to you with a quote.",
}

export default function OwnHelmetPage() {
  return (
    <section className="py-12 sm:py-16">
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
        <Suspense fallback={<FormSkeleton />}>
          <OwnHelmetContent />
        </Suspense>
      </Container>
    </section>
  )
}

async function OwnHelmetContent() {
  // A request needs an account (and a complete profile, asked for on the form).
  await requireUser("/helmet-builder/own-helmet")
  const [profile, priceBook] = await Promise.all([getMyProfile(), getPriceBook()])
  return <OwnHelmetForm profile={profile} films={pickableFilms(priceBook)} />
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
