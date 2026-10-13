import type { Metadata } from "next"

import { BrandStory } from "@/components/about/brand-story"
import { TeamGrid } from "@/components/about/team-grid"
import { ValuesGrid } from "@/components/about/values-grid"
import { CtaBand } from "@/components/shared/cta-band"
import { PageHero } from "@/components/shared/page-hero"

export const metadata: Metadata = {
  title: "About us",
  description:
    "Lucas Racing is a UK kart race team. Hydro Karts, run by the next generation of the sport, finishes every custom helmet in-house.",
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A race team with a paint shop"
        description="Lucas Racing brings the team, the track experience and the reach. Hydro Karts brings the hands that mask, dip and finish every helmet."
      />
      <BrandStory />
      <ValuesGrid />
      <TeamGrid />
      <CtaBand
        eyebrow="Start your design"
        title="Your colours, finished by our team"
        description="Browse the launch designs or tell the workshop what you have in mind."
      />
    </>
  )
}
