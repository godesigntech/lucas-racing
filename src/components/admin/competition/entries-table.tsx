import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import type { CompetitionEntry } from "@/types/competition"

import { EntryStatusBadge } from "./status-badges"

/** Competition entries as a table on desktop and stacked rows on mobile. */
export function EntriesTable({ entries, emptyMessage, templateNames }: { entries: CompetitionEntry[]; emptyMessage: string; templateNames: Record<string, string> }) {
  if (entries.length === 0) return <p className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>

  return (
    <>
      <ul className="divide-y divide-carbon/10 md:hidden">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link href={`/admin/competition/entries/${entry.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-foreground/[0.03]">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-semibold">{entry.designName}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(entry.updatedAt)}</span>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {entry.name} · {entry.reference}
                </p>
                <EntryStatusBadge status={entry.status} />
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Entry</TableHead>
            <TableHead>Design</TableHead>
            <TableHead>Entrant</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10 pr-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="group relative">
              <TableCell className="pl-5 font-semibold">
                <Link href={`/admin/competition/entries/${entry.id}`} className="after:absolute after:inset-0">
                  {entry.reference}
                </Link>
              </TableCell>
              <TableCell>
                <p className="font-medium">{entry.designName}</p>
                <p className="text-xs text-muted-foreground">{templateNames[entry.productSlug] ?? entry.productSlug}</p>
              </TableCell>
              <TableCell>
                <p className="font-medium">{entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.email}</p>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(entry.updatedAt)}</TableCell>
              <TableCell>
                <EntryStatusBadge status={entry.status} />
              </TableCell>
              <TableCell className="pr-5">
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
