import { competitionStatusMeta, entryStatusMeta } from "@/lib/competition/status"
import { toneClasses, type Tone } from "@/lib/orders/status"
import { cn } from "@/lib/utils"
import type { CompetitionStatus, EntryStatus } from "@/types/competition"

function Badge({ tone, label, className }: { tone: Tone; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  )
}

export function EntryStatusBadge({ status, className }: { status: EntryStatus; className?: string }) {
  return <Badge tone={entryStatusMeta[status].tone} label={entryStatusMeta[status].label} className={className} />
}

export function CompetitionStatusBadge({ status, className }: { status: CompetitionStatus; className?: string }) {
  return <Badge tone={competitionStatusMeta[status].tone} label={competitionStatusMeta[status].label} className={className} />
}
