import { Suspense } from "react"
import type { Metadata } from "next"
import { Droplets, Paintbrush, PackageCheck, Wrench } from "lucide-react"

import { CustomPartCard } from "@/components/kart-parts/custom-part-card"
import { KartPartsBrand } from "@/components/kart-parts/kart-parts-brand"
import { PreviewNotice } from "@/components/kart-parts/preview-notice"
import { Container } from "@/components/layout/container"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { ComingSoon } from "@/components/shared/coming-soon"
import { CtaBand } from "@/components/shared/cta-band"
import { PageHero } from "@/components/shared/page-hero"
import { SectionHeading } from "@/components/shared/section-heading"
import { Skeleton } from "@/components/ui/skeleton"
import { images } from "@/constants/images"
import { getPriceBook } from "@/lib/data/products"
import { canSeeKartParts, listCustomParts } from "@/lib/data/shop"

export const metadata: Metadata = {
  title: "MS Kart parts by HydroKarts",
  description: "Selected MS Kart parts finished in your own colours, hydro-dip films or chrome by HydroKarts.",
}

const steps = [
  { icon: Wrench, title: "Choose a part", text: "Genuine MS Kart components, picked because they look great finished." },
  { icon: Paintbrush, title: "Pick your finish", text: "Paint from our palette, any film from the hydro-dip library, or polished chrome." },
  { icon: Droplets, title: "We finish it", text: "Dipped, painted or chromed and lacquered in the HydroKarts workshop." },
  { icon: PackageCheck, title: "Ready to fit", text: "Collected at the circuit or posted to you, with your other parts." },
]

// Admin-only until the client approves the branding (Admin > Settings); customers see "coming soon".
export default function CustomKartPartsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <KartParts />
    </Suspense>
  )
}

async function KartParts() {
  const access = await canSeeKartParts()
  if (!access.visible) {
    return (
      <ComingSoon
        eyebrow="Customisation"
        title="MS Kart parts by HydroKarts"
        description="Selected MS Kart parts finished in your own colours, hydro-dip films or chrome, to match your helmet and kart."
        image={images.connor}
        points={[
          "Selected MS Kart components ready to customise",
          "The same paints, hydro-dip films and chrome as our custom helmets",
          "Match your parts to your helmet and team colours",
          "Order with your other parts in one basket",
        ]}
        enquiryMessage="Hi, I'd like a custom finish on some MS Kart parts. The parts are: "
      />
    )
  }

  const [parts, priceBook] = await Promise.all([listCustomParts(), getPriceBook()])

  return (
    <>
      {access.preview && <PreviewNotice />}
      <PageHero
        eyebrow="Customisation"
        title="MS Kart parts by HydroKarts"
        description="Genuine MS Kart parts finished in your own colours, hydro-dip films or chrome, to match your helmet and your kart."
        image={images.connor}
        brand={<KartPartsBrand preload />}
      />

      <section className="py-12 sm:py-16">
        <Container className="space-y-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Customisation", href: "/customisation" }, { label: "Kart parts" }]} />
          {parts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-carbon/20 p-10 text-center">
              <p className="font-display text-2xl font-bold uppercase">No parts yet</p>
              <p className="mt-2 text-muted-foreground">
                Add products to the HydroKarts parts shop in Admin, switch on &ldquo;Customisable&rdquo; and pick their finishes.
              </p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {parts.map((product) => (
                <li key={product.id} className="reveal">
                  <CustomPartCard product={product} priceBook={priceBook} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <section className="grid-texture bg-carbon py-16 text-paper sm:py-20">
        <Container className="space-y-10">
          <SectionHeading tone="light" eyebrow="How it works" title="From the box to your colours" />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="reveal rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-full bg-brand text-carbon">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-4xl font-bold text-white/15">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold uppercase">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <CtaBand
        eyebrow="Something else in mind?"
        title="Want a different part finished?"
        description="Tell us the part and the look you're after and we'll quote for it."
        primary={{ label: "Ask about a part", href: "/contact?message=Hi%2C%20I%27d%20like%20a%20custom%20finish%20on%20" }}
        secondary={{ label: "Custom helmets", href: "/customisation/helmets" }}
        image={images.connorCoaching}
      />
    </>
  )
}

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-80 rounded-none" />
      <Container className="grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="aspect-[4/5] rounded-3xl" />
        ))}
      </Container>
    </div>
  )
}
