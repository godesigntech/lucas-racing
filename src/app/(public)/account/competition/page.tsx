import { Suspense } from "react"
import Link from "next/link"
import { Trophy } from "lucide-react"

import { AccountPageHeader } from "@/components/account/account-page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatClosing } from "@/lib/competition/status"
import { getMyCompetitionEntries } from "@/lib/data/competition"
import { formatDate } from "@/lib/format"
import type { Competition, CompetitionEntry } from "@/types/competition"

export const metadata = { title: "Competition entry" }

export default function MyCompetitionPage() {
  return (
    <>
      <AccountPageHeader title="Competition" description="Your helmet competition entries. You can update your design until entries close." />
      <Suspense fallback={<Skeleton className="h-48 rounded-3xl" />}>
        <Entries />
      </Suspense>
    </>
  )
}

async function Entries() {
  const entries = await getMyCompetitionEntries()
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No entries yet"
        description="Design a helmet in our builder and enter it from the Review step."
        action={
          <Button asChild>
            <Link href="/competition">See the competition</Link>
          </Button>
        }
      />
    )
  }
  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-3xl border border-carbon/10 bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-bold uppercase leading-none">{entry.designName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {entry.competition?.title ?? "Competition"} · {entry.reference} · last updated {formatDate(entry.updatedAt)}
              </p>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{entrantStatus(entry, entry.competition).label}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{entrantStatus(entry, entry.competition).text}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/helmet-builder?template=${entry.productSlug}`}>Open the builder</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/competition">Competition details</Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** What the entrant sees. The shortlist stays private until the winner is announced. */
function entrantStatus(entry: CompetitionEntry, competition: Competition | null): { label: string; text: string } {
  if (entry.status === "winner") return { label: "Winner", text: "Congratulations, your design won! We'll be in touch to arrange your helmet." }
  if (entry.status === "disqualified") return { label: "Not eligible", text: "This entry doesn't meet the competition rules. Please contact us if you have questions." }
  if (competition?.status === "judged") return { label: "Closed", text: "The winner has been announced. Thanks for entering!" }
  if (competition?.status === "closed") return { label: "Entered", text: "Entries have closed and we're judging now. We'll email the winner." }
  return {
    label: "Entered",
    text: `You're in.${competition?.closesAt ? ` You can change your design and enter again until ${formatClosing(competition.closesAt)}.` : " You can change your design and enter again until entries close."}`,
  }
}
