import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { UserAvatar } from "@/components/shared/user-avatar"
import type { TeamMember } from "@/types/team"

/** Compact team card (homepage, About): photo, name, role and one line, linking to their profile. */
export function TeamCard({ member }: { member: TeamMember }) {
  const anchor = member.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-carbon/10 bg-card transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(17_20_18/0.45)] focus-within:ring-3 focus-within:ring-ring/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-carbon">
        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={member.photoAlt || member.name}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="chequer grid size-full place-items-center">
            <UserAvatar name={member.name} size="lg" className="size-20 text-2xl ring-4 ring-paper" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        {member.role && <p className="eyebrow text-brand-ink">{member.role}</p>}
        <h3 className="font-display text-3xl font-bold uppercase leading-none">
          <Link href={`/team#${anchor}`} className="outline-none after:absolute after:inset-0 after:content-['']">
            {member.name}
          </Link>
        </h3>
        {member.tagline && <p className="text-sm leading-relaxed text-muted-foreground">{member.tagline}</p>}
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold">
          Read more <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </article>
  )
}
