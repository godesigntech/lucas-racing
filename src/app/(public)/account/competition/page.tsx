import { Suspense } from "react"
import Link from "next/link"
import { Trophy } from "lucide-react"

import { AccountPageHeader } from "@/components/account/account-page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatClosing } from "@/lib/competition/status"
import { getMyCompetitionEntries, getMyVouchers } from "@/lib/data/competition"
import { formatDate } from "@/lib/format"
import type { Competition, CompetitionEntry, Voucher } from "@/types/competition"

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
  const [entries, vouchers] = await Promise.all([getMyCompetitionEntries(), getMyVouchers()])
  return (
    <div className="space-y-6">
      {vouchers.length > 0 && <Vouchers vouchers={vouchers} />}
      <EntryList entries={entries} />
    </div>
  )
}

/** Vouchers from the competition: a code to enter at checkout, valid 12 months. */
function Vouchers({ vouchers }: { vouchers: Voucher[] }) {
  return (
    <section aria-labelledby="vouchers-heading" className="space-y-3">
      <h2 id="vouchers-heading" className="font-display text-2xl font-bold uppercase">
        Your vouchers
      </h2>
      <ul className="space-y-3">
        {vouchers.map((voucher) => {
          const expired = voucher.expired
          return (
            <li key={voucher.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-carbon/10 bg-card p-5">
              <div>
                <p className="font-display text-2xl font-bold uppercase leading-none">{voucher.percentOff}% off a custom helmet finish</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {voucher.description}
                  {voucher.redeemedAt ? ` · used ${formatDate(voucher.redeemedAt)}` : expired ? " · expired" : ` · use by ${formatDate(voucher.expiresAt)}`}
                </p>
              </div>
              <span className={`rounded-xl px-3 py-2 font-mono text-base font-semibold ${voucher.redeemedAt || expired ? "bg-carbon/5 text-muted-foreground line-through" : "bg-accent text-accent-foreground"}`}>
                {voucher.code}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">Design your helmet in the builder and enter the code at checkout.</p>
    </section>
  )
}

function EntryList({ entries }: { entries: (CompetitionEntry & { competition: Competition | null })[] }) {
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
  if (competition?.status === "closed") return { label: "Entered", text: "Entries have closed. Vote for your favourite design (not your own) on our Facebook page." }
  return {
    label: "Entered",
    text: `You're in.${competition?.closesAt ? ` You can change your design and enter again until ${formatClosing(competition.closesAt)}.` : " You can change your design and enter again until entries close."}`,
  }
}
