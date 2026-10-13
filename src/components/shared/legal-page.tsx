import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"

interface LegalSection {
  heading: string
  body: string
}

interface LegalPageProps {
  title: string
  intro: string
  sections: LegalSection[]
}

/** Layout for policy pages. Content is placeholder until Lucas Racing supplies its own policies. */
export function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} description={intro} />
      <section className="py-14 sm:py-20">
        <Container size="narrow" className="space-y-10">
          <p className="rounded-2xl border border-dashed border-carbon/25 bg-card p-4 text-sm text-muted-foreground">
            Draft placeholder. Lucas Racing will supply the final wording before launch. It isn’t legal advice.
          </p>
          {sections.map((section) => (
            <div key={section.heading} className="space-y-3">
              <h2 className="font-display text-3xl font-bold uppercase">{section.heading}</h2>
              <p className="leading-relaxed text-carbon/80">{section.body}</p>
            </div>
          ))}
        </Container>
      </section>
    </>
  )
}
