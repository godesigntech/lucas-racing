import { Quote } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { sampleTestimonials } from "@/data/home"

export function Testimonials() {
  return (
    <section className="border-t border-carbon/10 bg-smoke/60 py-20 sm:py-24">
      <Container className="space-y-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading eyebrow="From the paddock" title="What drivers say" />
          <p className="rounded-full border border-dashed border-carbon/25 px-4 py-2 font-mono text-xs text-muted-foreground">
            Sample reviews for layout. Real customer reviews to follow.
          </p>
        </div>
        <ul className="grid gap-5 md:grid-cols-3">
          {sampleTestimonials.map((testimonial) => (
            <li key={testimonial.detail}>
              <figure className="flex h-full flex-col rounded-3xl border border-carbon/10 bg-card p-7">
                <Quote className="size-7 text-lime-ink" aria-hidden />
                <blockquote className="mt-5 flex-1 text-base leading-relaxed">“{testimonial.quote}”</blockquote>
                <figcaption className="mt-6 border-t border-carbon/10 pt-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.detail}</p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
