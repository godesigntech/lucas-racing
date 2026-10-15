import type { Metadata } from "next"

import { BrandStory } from "@/components/about/brand-story"
import { MsKartDistributor } from "@/components/about/ms-kart-distributor"
import { TeamGrid } from "@/components/about/team-grid"
import { ValuesGrid } from "@/components/about/values-grid"
import { CtaBand } from "@/components/shared/cta-band"
import { PageHero } from "@/components/shared/page-hero"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "About us",
  description:
    "Lucas Racing is a family-run karting team from Oldham, Greater Manchester, and the exclusive UK distributor of MS Kart since 1999. Family run. Race proven.",
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Lucas Racing"
        title="A family built around racing"
        description="A reputation built on results. At Lucas Racing, karting is more than a sport. It's a way of life."
        image={images.orangeKart}
      />
      <BrandStory />
      <TeamGrid />
      <ValuesGrid />
      <MsKartDistributor />
      <CtaBand
        eyebrow="Lucas Racing · Family run. Race proven."
        title="Racing is in our blood"
        description="Early mornings at the circuit, late nights preparing karts, and the satisfaction of seeing someone achieve something they once thought impossible. Join the family. Enjoy the racing."
      />
    </>
  )
}
