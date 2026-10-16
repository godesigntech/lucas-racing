import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { CustomisationEntryCards } from "@/components/customisation/customisation-entry-cards"
import { FilmLibraryHighlight } from "@/components/customisation/film-library-highlight"
import { FilmTicker } from "@/components/customisation/film-ticker"
import { OpenAssistantButton } from "@/components/customisation/open-assistant-button"
import { ProcessSteps } from "@/components/customisation/process-steps"
import { WhyChooseUs } from "@/components/customisation/why-choose-us"
import { Container } from "@/components/layout/container"
import { CtaBand } from "@/components/shared/cta-band"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"
import { getPriceBook } from "@/lib/data/products"
import { getSiteSettings } from "@/lib/data/settings"

export const metadata: Metadata = {
  title: "Customisation by HydroKarts",
  description:
    "Custom Arai SK-6 and Bell KC7 kart helmets and MS Kart parts finished by HydroKarts: paint, hundreds of hydro-dip films and in-house chrome.",
}

/** Customisation by HydroKarts: helmets now, MS Kart parts once the branding is approved. */
export default async function CustomisationPage() {
  const [priceBook, settings] = await Promise.all([getPriceBook(), getSiteSettings()])

  return (
    <>
      <PageHero
        eyebrow="Customisation by HydroKarts"
        title={
          <>
            Your colours.
            <span className="block text-brand">On everything.</span>
          </>
        }
        description="Custom helmets and kart parts, designed with you and finished in the HydroKarts workshop: paint, hydro-dip films, chrome and lacquer."
        image={images.fatherAndSonPaddock}
        logo={brandLogos.lucasRacingByHydroKarts}
      />
      <FilmTicker />
      <CustomisationEntryCards partsLive={settings.kartPartsLive} />
      <FilmLibraryHighlight films={priceBook.films} />
      <ProcessSteps />

      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="reveal relative isolate grid gap-8 overflow-clip rounded-[2rem] bg-accent p-8 sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div aria-hidden className="absolute -right-16 -top-16 -z-10 size-64 rounded-full bg-brand/20 blur-3xl" />
            <div className="space-y-4">
              <p className="eyebrow inline-flex items-center gap-2 text-brand-ink">
                <Sparkles className="size-4" aria-hidden /> Design assistant
              </p>
              <h2 className="display text-4xl sm:text-5xl">Not sure where to start?</h2>
              <p className="max-w-xl leading-relaxed text-carbon/75">
                Upload a photo of your current helmet or a design you love. The assistant suggests the closest template and
                colours, then you can fine-tune it in the builder or ask us for a quote.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-start">
              <OpenAssistantButton />
              <Button asChild size="lg" variant="outline">
                <Link href="/helmet-builder">
                  Open the helmet builder <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <WhyChooseUs />
      <CtaBand
        eyebrow="Your helmet, your colours"
        title="Ready to put your name on the grid?"
        description="Pick a design to start from, or tell us what you have in mind. We'll send a proof before anything is painted."
        primary={{ label: "Browse helmet designs", href: "/customisation/helmets" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
        image={images.connorCoaching}
      />
    </>
  )
}
