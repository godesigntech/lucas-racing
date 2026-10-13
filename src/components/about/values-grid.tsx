import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { values } from "@/data/about"

export function ValuesGrid() {
  return (
    <section className="grid-texture bg-carbon py-20 text-paper sm:py-24">
      <Container className="space-y-12">
        <SectionHeading
          tone="light"
          eyebrow="Mission and values"
          title="Make every driver look like a front-runner"
          description="Our mission is simple: give karters at every level a helmet that's genuinely theirs, finished to a standard they're proud to race in."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <li key={value.title} className="rounded-3xl border border-white/10 bg-carbon-2 p-6">
              <span className="block h-1 w-10 rounded-full bg-lime" aria-hidden />
              <h3 className="mt-5 font-display text-2xl font-bold uppercase">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/65">{value.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
