import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CircleCheck } from "lucide-react"

import { ValuesGrid } from "@/components/about/values-grid"
import { Container } from "@/components/layout/container"
import { CtaBand } from "@/components/shared/cta-band"
import { PageHero } from "@/components/shared/page-hero"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { images } from "@/constants/images"
import { services } from "@/data/about"

export const metadata: Metadata = {
  title: "Racing support and driver development",
  description:
    "Kart preparation, setup advice, technical support and driver development from Lucas Racing, for drivers at every stage of their racing journey.",
}

const enquiryHref = `/contact?${new URLSearchParams({ message: "Hi, I'd like to talk about racing support with Lucas Racing. I race in: " })}`

export default function RacingSupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Racing support"
        title="Support for the driver and the kart"
        description="From your first test day to championship weekends, the Lucas Racing team prepares the kart, helps with setup and supports the driver behind the helmet."
        image={images.connorCoaching}
      >
        <Button asChild size="lg" className="mt-8">
          <Link href={enquiryHref}>
            Talk to us about racing support <ArrowRight />
          </Link>
        </Button>
      </PageHero>

      <section className="py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="space-y-6">
            <SectionHeading eyebrow="What we offer" title="Everything you need on race day" />
            <p className="leading-relaxed text-carbon/80">
              Our knowledge has been developed where it matters most: at the circuit. We race the same MS Kart equipment we
              supply, so the advice you get comes from people who use it every weekend.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <li key={service} className="flex gap-2.5 text-sm">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden />
                  {service}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-carbon">
            <Image src={images.connor.src} alt={images.connor.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
        </Container>
      </section>

      <section className="pb-20 sm:pb-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="relative order-last aspect-[4/3] overflow-hidden rounded-[2rem] bg-carbon lg:order-first">
            <Image
              src={images.connorCoaching.src}
              alt={images.connorCoaching.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="space-y-6">
            <SectionHeading eyebrow="Driver development" title="Helping the next generation" />
            <div className="space-y-4 leading-relaxed text-carbon/80">
              <p>
                Young drivers need encouragement as much as lap time. Connor, who grew up in the paddock himself, works with
                younger racers on track craft, kart preparation and confidence, and is there after a difficult race as well as
                a good one.
              </p>
              <p>
                Parents are looked after too: welcomed at the circuit, kept in the loop and, thanks to Wendy, well fed. When you
                race with Lucas Racing, you&apos;re never just another number on the grid.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/team">Meet the team</Link>
            </Button>
          </div>
        </Container>
      </section>

      <ValuesGrid />

      <CtaBand
        eyebrow="Get on the grid"
        title="Race with Lucas Racing"
        description="Tell us about your racing, your class and what you're looking for, and we'll get back to you."
        primary={{ label: "Send us a message", href: enquiryHref }}
        secondary={{ label: "Shop MS Kart", href: "/shop" }}
        image={images.fatherAndSonPaddock}
      />
    </>
  )
}
