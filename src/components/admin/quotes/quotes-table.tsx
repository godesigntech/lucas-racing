import Link from "next/link"
import { ChevronRight, ImageIcon } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { quoteHelmetLabels, type QuoteHelmet, type QuoteRequest } from "@/types/design-assistant"

import { QuoteStatusBadge } from "./quote-status-badge"

function helmetLabel(value: string): string {
  return quoteHelmetLabels[value as QuoteHelmet] ?? value
}

function Swatches({ palette }: { palette: string[] }) {
  if (palette.length === 0) return <span className="text-xs text-muted-foreground">No colours</span>
  return (
    <span className="flex -space-x-1" aria-label={`${palette.length} colours`}>
      {palette.slice(0, 5).map((hex) => (
        <span key={hex} className="size-5 rounded-full ring-2 ring-card" style={{ backgroundColor: hex }} />
      ))}
    </span>
  )
}

/** Quote requests as a table on desktop and stacked rows on mobile. */
export function QuotesTable({ quotes, emptyMessage }: { quotes: QuoteRequest[]; emptyMessage: string }) {
  if (quotes.length === 0) {
    return <p className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <>
      <ul className="divide-y divide-carbon/10 md:hidden">
        {quotes.map((quote) => (
          <li key={quote.id}>
            <Link href={`/admin/quotes/${quote.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-foreground/[0.03]">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{quote.reference}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(quote.createdAt)}</span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{quote.name}</p>
                <div className="flex items-center gap-2">
                  <QuoteStatusBadge status={quote.status} />
                  <Swatches palette={quote.palette} />
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Request</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Helmet</TableHead>
            <TableHead>Colours</TableHead>
            <TableHead className="pr-5">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow key={quote.id} className="group relative">
              <TableCell className="pl-5 font-semibold">
                <Link
                  href={`/admin/quotes/${quote.id}`}
                  className="inline-flex items-center gap-1.5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline"
                >
                  {quote.reference}
                  {quote.imagePath && <ImageIcon className="size-3.5 text-muted-foreground" aria-label="Has a photo" />}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(quote.createdAt)}</TableCell>
              <TableCell>
                <p className="font-medium">{quote.name}</p>
                <p className="text-xs text-muted-foreground">
                  {quote.email}
                  {!quote.userId && " · guest"}
                </p>
              </TableCell>
              <TableCell className="text-sm">
                {quote.kind === "own_helmet" ? (
                  <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                    Own helmet{quote.details.makeModel ? `: ${quote.details.makeModel}` : ""}
                  </span>
                ) : (
                  helmetLabel(quote.helmet)
                )}
              </TableCell>
              <TableCell>
                <Swatches palette={quote.palette} />
              </TableCell>
              <TableCell className="pr-5">
                <QuoteStatusBadge status={quote.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
