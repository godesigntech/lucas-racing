import { UserRound } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { team } from "@/data/about"

export function TeamGrid() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="space-y-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading eyebrow="The team" title="Who's behind your helmet" />
          <p className="rounded-full border border-dashed border-carbon/25 px-4 py-2 font-mono text-xs text-muted-foreground">
            Names and photos to be added
          </p>
        </div>
        <ul className="grid gap-5 md:grid-cols-3">
          {team.map((member) => (
            <li key={member.role} className="overflow-hidden rounded-3xl border border-carbon/10 bg-card">
              <div className="chequer grid aspect-[4/3] place-items-center opacity-90">
                <span className="grid size-20 place-items-center rounded-full bg-paper text-carbon shadow-lg">
                  <UserRound className="size-9" aria-hidden />
                </span>
              </div>
              <div className="space-y-2 p-6">
                <p className="eyebrow text-lime-ink">{member.role}</p>
                <h3 className="font-display text-2xl font-bold uppercase">{member.name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
