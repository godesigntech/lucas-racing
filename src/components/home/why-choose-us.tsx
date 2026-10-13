import Image from "next/image"
import { Check } from "lucide-react"

import { FilmSwatch } from "@/components/helmet/film-swatch"
import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { images } from "@/constants/images"

const reasons = [
  {
    title: "Designed by a race team",
    body: "Lucas Racing is a working race team. Our layouts are built to read clearly on track, in any light.",
  },
  {
    title: "You approve before we dip",
    body: "You see and sign off the exact design before any masking or dipping starts.",
  },
  {
    title: "One workshop, every finish",
    body: "Masking, hydro-dipping, chrome and lacquer all happen in-house at Hydro Karts.",
  },
]

const swatches = [
  { film: "carbon", tint: "#c6f432" },
  { film: "forged", tint: "#ff6a13" },
  { film: "hex", tint: "#1f5bd8" },
  { film: "camo", tint: "#6b7a4f" },
] as const

export function WhyChooseUs() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-carbon sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src={images.driverHelmet.src}
              alt={images.driverHelmet.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-carbon/70 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-5 right-5 font-display text-2xl font-bold uppercase leading-tight text-paper sm:text-3xl">
              A helmet is the one part of the kit everyone sees.
            </p>
          </div>
          <div className="absolute -right-2 -top-6 hidden rounded-3xl border border-carbon/10 bg-card p-4 shadow-xl sm:block lg:-right-8">
            <p className="eyebrow mb-3 text-muted-foreground">Film library</p>
            <ul className="grid grid-cols-4 gap-2">
              {swatches.map((swatch) => (
                <li key={swatch.film} className="size-12 overflow-hidden rounded-xl ring-1 ring-carbon/10">
                  <FilmSwatch film={swatch.film} tint={swatch.tint} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          <SectionHeading
            eyebrow="Why Lucas Racing"
            title="Racers designing for racers"
            description="Hydro Karts is run by twin brothers who customise race helmets. Now part of the Lucas Racing team, they finish helmets for the team and for drivers across the UK."
          />
          <ul className="space-y-5">
            {reasons.map((reason) => (
              <li key={reason.title} className="flex gap-4">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-lime text-carbon">
                  <Check className="size-4" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">{reason.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{reason.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
