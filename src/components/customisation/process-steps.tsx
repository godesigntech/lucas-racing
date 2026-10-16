import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { processSteps } from "@/data/home"

export function ProcessSteps() {
  return (
    <section id="how-it-works" className="grid-texture bg-carbon py-20 text-paper sm:py-24">
      <Container className="space-y-12">
        <SectionHeading
          tone="light"
          eyebrow="How it works"
          title="From template to track in four steps"
          description="Nothing is masked, dipped or lacquered until you've approved the exact design."
        />
        <ol className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <li key={step.title} className="relative bg-carbon p-7 transition-colors duration-300 hover:bg-carbon-2">
              <span className="font-display text-6xl font-extrabold leading-none text-brand/90">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 font-display text-2xl font-bold uppercase">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/65">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
