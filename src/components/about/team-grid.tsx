import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { UserAvatar } from "@/components/shared/user-avatar"
import { family } from "@/data/about"

export function TeamGrid() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="space-y-12">
        <SectionHeading
          eyebrow="Meet the Lucas family"
          title="The people behind the team"
          description="Lucas Racing has always been about more than motorsport. It's about dedication, hard work, friendship and family."
        />
        <ul className="grid gap-5 lg:grid-cols-3">
          {family.map((member) => (
            <li key={member.name} className="flex flex-col overflow-hidden rounded-3xl border border-carbon/10 bg-card">
              <div className="chequer grid aspect-[16/9] place-items-center">
                <UserAvatar name={member.name} size="lg" className="size-20 text-2xl shadow-lg ring-4 ring-paper" />
              </div>
              <div className="flex-1 space-y-3 p-6">
                <p className="eyebrow text-lime-ink">{member.role}</p>
                <div>
                  <h3 className="font-display text-3xl font-bold uppercase leading-none">{member.name}</h3>
                  <p className="mt-1 text-sm font-medium text-carbon/70">{member.tagline}</p>
                </div>
                {member.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
