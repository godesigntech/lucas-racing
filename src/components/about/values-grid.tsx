import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { values } from "@/data/about"

export function ValuesGrid() {
  return (
    <section className="grid-texture bg-carbon py-20 text-paper sm:py-24">
      <Container className="space-y-12">
        <SectionHeading
          tone="light"
          eyebrow="More than a racing team"
          title="Supporting the person behind the helmet"
          description="Motorsport can be fiercely competitive, but it should also be enjoyable, welcoming and rewarding. Supporting the driver is every bit as important as preparing the kart beneath them."
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
        <p className="max-w-3xl text-paper/70">
          Whether you&apos;re celebrating your first podium, recovering from a difficult weekend or preparing for a major
          championship, we&apos;re there to share the experience. Because while trophies are important, the friendships,
          memories and relationships built through racing last far longer.
        </p>
      </Container>
    </section>
  )
}
