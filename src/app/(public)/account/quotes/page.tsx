import { Suspense } from "react"
import { Sparkles } from "lucide-react"

import { AccountPageHeader } from "@/components/account/account-page-header"
import { QuoteStatusBadge } from "@/components/admin/quotes/quote-status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { getMyQuotes } from "@/lib/data/account"
import { formatDate } from "@/lib/format"
import { quoteStatusMeta } from "@/lib/quotes/status"
import { quoteHelmetLabels, type QuoteHelmet } from "@/types/design-assistant"

export const metadata = { title: "Quote requests" }

export default function MyQuotesPage() {
  return (
    <>
      <AccountPageHeader
        title="Quote requests"
        description="Designs you sent to the workshop from the design assistant. We reply by email with a price and a proof."
      />
      <Suspense fallback={<Skeleton className="h-60 rounded-3xl" />}>
        <Quotes />
      </Suspense>
    </>
  )
}

async function Quotes() {
  const quotes = await getMyQuotes()

  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No quote requests yet"
        description="Open the design assistant (bottom right), add a photo of your helmet or an idea, and ask for a quote."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {quotes.map((quote) => (
        <li key={quote.id} className="rounded-3xl border border-carbon/10 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-bold uppercase leading-none">{quote.reference}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {quoteHelmetLabels[quote.helmet as QuoteHelmet] ?? quote.helmet} · sent {formatDate(quote.createdAt)}
              </p>
            </div>
            <QuoteStatusBadge status={quote.status} />
          </div>
          {quote.summary && <p className="mt-3 text-sm leading-relaxed text-carbon/80">{quote.summary}</p>}
          <p className="mt-3 text-xs text-muted-foreground">{customerStatus[quote.status] ?? quoteStatusMeta[quote.status].description}</p>
        </li>
      ))}
    </ul>
  )
}

/** Status explained from the customer's side. */
const customerStatus: Partial<Record<keyof typeof quoteStatusMeta, string>> = {
  new: "The workshop has your request and will be in touch soon.",
  contacted: "We've been in touch. Check your email for our reply.",
  quoted: "We've sent you a price and a proof by email.",
  won: "Thanks for going ahead. Your order is with the workshop.",
  lost: "This request is closed. Send a new one any time.",
}
