import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import type { HelmetLook } from "@/types/helmet"

const heroLook: HelmetLook = {
  layout: "apex",
  finish: "gloss",
  base: "#f4f3ee",
  graphic: "#c6f432",
  accent: "#111412",
  film: "forged",
  trim: "#c6f432",
  spoiler: true,
  number: "29",
  name: "LUCAS",
}

const heroTags = [
  { label: "Shell", value: "Arai SK-6", className: "left-[4%] top-[12%]" },
  { label: "Film", value: "Forged carbon, lime tint", className: "bottom-[6%] right-[4%]" },
  { label: "Trim", value: "Lime rubbers", className: "bottom-[14%] left-[4%]" },
]

export function HomeHero() {
  return (
    <section className="grid-texture relative overflow-hidden bg-carbon text-paper">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 size-[32rem] rounded-full bg-lime/10 blur-3xl" />
      <Container className="relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:py-24">
        <div className="space-y-7">
          <p className="eyebrow inline-flex items-center gap-2 text-lime">
            <span className="h-px w-8 bg-lime" aria-hidden />
            Lucas Racing × Hydro Karts
          </p>
          <h1 className="display text-[2.75rem] min-[400px]:text-[3.25rem] sm:text-7xl xl:text-[5.6rem]">
            Built for the grid.
            <br />
            <span className="text-lime">Designed by you.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
            Custom Arai SK-6 and Bell KC7 helmets with racing-line templates, hydro-dip films and in-house chrome. Add your
            name, number and trim colours, then approve every detail before we dip a thing.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/products">
                Explore helmet designs
                <ArrowRight className="transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="inverse">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
          <dl className="grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              ["2", "Launch shells"],
              ["20", "Templates at launch"],
              ["1", "UK workshop"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-4xl font-bold leading-none text-paper">{value}</dd>
                <dd className="mt-1 text-xs text-paper/55">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div aria-hidden className="absolute inset-[12%] rounded-full bg-lime/20 blur-2xl" />
          <div aria-hidden className="absolute inset-[8%] rounded-full border border-white/10" />
          <div aria-hidden className="absolute inset-[20%] rounded-full border border-dashed border-white/10" />
          <HelmetArt
            look={heroLook}
            title="Custom Arai SK-6 with a lime forged-carbon sweep and number 29"
            className="relative drop-shadow-[0_30px_40px_rgb(0_0_0/0.45)]"
          />
          {heroTags.map((tag) => (
            <div
              key={tag.label}
              className={`absolute hidden rounded-2xl border border-white/10 bg-carbon-2/85 px-3.5 py-2 backdrop-blur sm:block ${tag.className}`}
            >
              <p className="eyebrow text-[0.62rem] text-lime">{tag.label}</p>
              <p className="text-sm font-medium text-paper">{tag.value}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
