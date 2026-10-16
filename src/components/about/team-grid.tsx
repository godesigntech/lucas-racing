import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { TeamCard } from "@/components/team/team-card"
import { Button } from "@/components/ui/button"
import { getTeamMembers } from "@/lib/data/team"

interface TeamGridProps {
  eyebrow?: string
  title?: string
  description?: string
}

/** The featured team members (Howard, Connor, Wendy) as cards, linking to Meet the Team. */
export async function TeamGrid({
  eyebrow = "Meet the Lucas family",
  title = "The people behind the team",
  description = "Lucas Racing has always been about more than motorsport. It's about dedication, hard work, friendship and family.",
}: TeamGridProps) {
  const members = (await getTeamMembers()).filter((member) => member.featured)
  if (members.length === 0) return null

  return (
    <section className="py-20 sm:py-24">
      <Container className="space-y-12">
        <div className="reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow={eyebrow} title={title} description={description} />
          <Button asChild variant="outline" className="self-start lg:self-auto">
            <Link href="/team">
              Meet the whole team <ArrowRight />
            </Link>
          </Button>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <li key={member.id} className="reveal">
              <TeamCard member={member} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
