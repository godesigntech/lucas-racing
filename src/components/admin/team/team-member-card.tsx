"use client"

import { Pencil, Star, Trash2, UserRound } from "lucide-react"
import { toast } from "react-toastify"

import { ActiveSwitch } from "@/components/admin/active-switch"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteTeamMember, setTeamMemberActive } from "@/lib/actions/admin/team"
import { cn } from "@/lib/utils"
import type { TeamMember } from "@/types/team"

import { TeamMemberDialog } from "./team-member-dialog"

/** One team member in Admin > Team, with edit, show/hide and remove. */
export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <li className={cn("flex flex-col overflow-hidden rounded-2xl border border-carbon/10 bg-card", !member.isActive && "opacity-60")}>
      <div className="relative aspect-[4/3] bg-carbon/5">
        {member.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of a local or uploaded photo
          <img src={member.photoUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <UserRound className="size-8" aria-hidden />
          </span>
        )}
        {member.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[0.7rem] font-semibold text-carbon">
            <Star className="size-3" aria-hidden /> Homepage
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{member.name}</p>
          <p className="truncate text-sm text-muted-foreground">{member.role || "No role yet"}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <ActiveSwitch
            checked={member.isActive}
            label={`Show ${member.name} on the website`}
            onToggle={(next) => setTeamMemberActive(member.id, next)}
          />
          <div className="flex gap-1.5">
            <TeamMemberDialog
              member={member}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil /> Edit
                </Button>
              }
            />
            <ConfirmDialog
              title={`Remove ${member.name}?`}
              description="They'll be taken off Meet the Team and the homepage. To hide them for now, switch them off instead."
              confirmLabel="Remove"
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${member.name}`}>
                  <Trash2 />
                </Button>
              }
              onConfirm={async () => {
                const result = await deleteTeamMember(member.id)
                if (result.ok) toast.success(result.message)
                else toast.error(result.message)
                return result.ok
              }}
            />
          </div>
        </div>
      </div>
    </li>
  )
}
