import { Droplets, Flag, Layers, Sparkles, type LucideIcon } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { benefits, type BenefitIcon } from "@/data/home"

const icons: Record<BenefitIcon, LucideIcon> = {
  layers: Layers,
  droplets: Droplets,
  sparkles: Sparkles,
  flag: Flag,
}

export function Benefits() {
  return (
    <section className="border-y border-carbon/10 bg-smoke/60 py-20 sm:py-24">
      <Container className="space-y-12">
        <SectionHeading
          eyebrow="What you get"
          title="Everything a race helmet needs"
          description="From the first template to the final lacquer, the design and the finishing happen under one roof."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = icons[benefit.icon]
            return (
              <li
                key={benefit.title}
                className="group rounded-3xl border border-carbon/10 bg-card p-6 transition-colors duration-300 hover:border-carbon/25"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-carbon text-brand transition-transform duration-300 group-hover:-rotate-6">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold uppercase leading-tight">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{benefit.body}</p>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
