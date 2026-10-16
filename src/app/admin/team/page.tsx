import { Suspense } from "react"
import { Plus } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { TeamMemberCard } from "@/components/admin/team/team-member-card"
import { TeamMemberDialog } from "@/components/admin/team/team-member-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminTeamMembers } from "@/lib/data/team"

export const metadata = { title: "Team" }

export default function AdminTeamPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[30rem] rounded-2xl" />}>
      <TeamList />
    </Suspense>
  )
}

async function TeamList() {
  const members = await listAdminTeamMembers()
  const nextSortOrder = members.reduce((highest, member) => Math.max(highest, member.sortOrder), 0) + 10

  return (
    <>
      <AdminPageHeader
        title="Team"
        description="The people on Meet the Team. Mark someone for the homepage to show them in its team section."
        actions={
          <TeamMemberDialog
            nextSortOrder={nextSortOrder}
            trigger={
              <Button>
                <Plus /> Add a team member
              </Button>
            }
          />
        }
      />
      {members.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-carbon/20 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          No team members yet. Add Howard, Connor, Wendy and the wider team.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </ul>
      )}
    </>
  )
}
