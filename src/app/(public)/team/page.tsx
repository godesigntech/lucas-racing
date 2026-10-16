import { Suspense } from "react"
import type { Metadata } from "next"
import Image from "next/image"

import { Container } from "@/components/layout/container"
import { CtaBand } from "@/components/shared/cta-band"
import { PageHero } from "@/components/shared/page-hero"
import { SectionHeading } from "@/components/shared/section-heading"
import { TeamCard } from "@/components/team/team-card"
import { TeamProfile } from "@/components/team/team-profile"
import { Skeleton } from "@/components/ui/skeleton"
import { images } from "@/constants/images"
import { getTeamMembers } from "@/lib/data/team"

export const metadata: Metadata = {
  title: "Meet the team",
  description:
    "Meet Howard, Connor and Wendy Lucas and the Lucas Racing team: a family-run kart racing operation that supports drivers at every level.",
}

export default function TeamPage() {
  return (
    <>
      <PageHero
        eyebrow="Meet the team"
        title="The people behind Lucas Racing"
        description="Lucas Racing is a family-run racing team. These are the people you'll meet at the circuit, in the workshop and on the end of the phone."
        image={images.teamPhoto}
      />
      <Suspense fallback={<TeamSkeleton />}>
        <TeamList />
      </Suspense>
      <section className="pb-20 sm:pb-24">
        <Container>
          <figure className="overflow-hidden rounded-[2rem] border border-carbon/10 bg-card">
            <div className="relative aspect-[3/2] sm:aspect-[21/9]">
              <Image src={images.teamPhoto.src} alt={images.teamPhoto.alt} fill sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
            </div>
            <figcaption className="px-6 py-4 text-sm text-muted-foreground">
              The wider Lucas Racing family: drivers, parents, mechanics and friends at a race weekend.
            </figcaption>
          </figure>
        </Container>
      </section>
      <CtaBand
        eyebrow="Race with us"
        title="Join the Lucas Racing family"
        description="Whether you're starting out or chasing championships, talk to the team about racing support, karts and parts."
      />
    </>
  )
}

async function TeamList() {
  const members = await getTeamMembers()
  const family = members.filter((member) => member.featured)
  const wider = members.filter((member) => !member.featured)

  return (
    <>
      <section className="py-20 sm:py-24">
        <Container className="space-y-20 sm:space-y-24">
          {family.map((member, index) => (
            <TeamProfile key={member.id} member={member} reverse={index % 2 === 1} preload={index === 0} />
          ))}
        </Container>
      </section>
      {wider.length > 0 && (
        <section className="border-t border-carbon/10 py-20 sm:py-24">
          <Container className="space-y-10">
            <SectionHeading eyebrow="The wider team" title="Mechanics, coaches and friends" />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {wider.map((member) => (
                <li key={member.id}>
                  <TeamCard member={member} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  )
}

function TeamSkeleton() {
  return (
    <Container className="space-y-16 py-20" aria-busy="true" aria-label="Loading the team">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] rounded-[2rem]" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ))}
    </Container>
  )
}
