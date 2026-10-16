import Link from "next/link"
import { ArrowRight, BellRing, CircleCheck } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import type { BrandLogo } from "@/constants/brand"
import type { SiteImage } from "@/constants/images"

import { PageHero } from "./page-hero"

interface ComingSoonProps {
  eyebrow: string
  title: string
  description: string
  image: SiteImage
  logo?: BrandLogo
  /** What the section will offer when it launches. */
  points: string[]
  /** Contact form topic used by "Ask us about it". */
  enquiryMessage: string
}

/** Holding page for a section that is being prepared (waiting on products, content or approval). */
export function ComingSoon({ eyebrow, title, description, image, logo, points, enquiryMessage }: ComingSoonProps) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} image={image} logo={logo}>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-carbon">
          <BellRing className="size-4" aria-hidden /> Coming soon
        </span>
      </PageHero>
      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <h2 className="font-display text-3xl font-bold uppercase">What&apos;s on the way</h2>
            <ul className="mt-6 space-y-4">
              {points.map((point) => (
                <li key={point} className="flex gap-3">
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-ink" aria-hidden />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-carbon/10 bg-card p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold uppercase">Need something now?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The team can help today. Send us a message and we&apos;ll get back to you, or design a custom helmet while you wait.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Button asChild>
                <Link href={`/contact?${new URLSearchParams({ message: enquiryMessage })}`}>
                  Ask us about it <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/customisation">Design a helmet</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
