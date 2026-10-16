import Image from "next/image"

import { UserAvatar } from "@/components/shared/user-avatar"
import { cn } from "@/lib/utils"
import type { TeamMember } from "@/types/team"

interface TeamProfileProps {
  member: TeamMember
  /** Put the photo on the right (alternating rows). */
  reverse?: boolean
  /** Load the photo straight away (first profile on the page). */
  preload?: boolean
}

/** Full profile on Meet the Team: photo, name, role and introduction. */
export function TeamProfile({ member, reverse, preload }: TeamProfileProps) {
  return (
    <article id={member.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="grid scroll-mt-28 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={cn("relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-carbon", reverse && "lg:order-2")}>
        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={member.photoAlt || member.name}
            fill
            preload={preload}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="chequer grid size-full place-items-center">
            <UserAvatar name={member.name} size="lg" className="size-24 text-3xl ring-4 ring-paper" />
          </div>
        )}
      </div>
      <div className="space-y-4">
        {member.role && <p className="eyebrow text-brand-ink">{member.role}</p>}
        <h2 className="display text-5xl sm:text-6xl">{member.name}</h2>
        {member.tagline && <p className="text-lg font-medium text-carbon/80">{member.tagline}</p>}
        <div className="space-y-3 leading-relaxed text-muted-foreground">
          {member.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  )
}
