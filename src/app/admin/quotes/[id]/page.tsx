import { Suspense } from "react"
import Link from "next/link"
import { ExternalLink, Mail, Phone, UserRound } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { QuoteStatusBadge } from "@/components/admin/quotes/quote-status-badge"
import { QuoteUpdateForm } from "@/components/admin/quotes/quote-update-form"
import { HelmetArt } from "@/components/helmet/helmet-art"
import { Skeleton } from "@/components/ui/skeleton"
import { nameColour } from "@/lib/design-assistant/colour"
import { getQuoteRequest } from "@/lib/data/quotes"
import { formatDateTime } from "@/lib/format"
import { quoteHelmetLabels, type QuoteHelmet } from "@/types/design-assistant"

export const metadata = { title: "Quote request" }

export default function AdminQuotePage({ params }: PageProps<"/admin/quotes/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
      {params.then(({ id }) => (
        <QuoteDetail id={id} />
      ))}
    </Suspense>
  )
}

async function QuoteDetail({ id }: { id: string }) {
  const { quote, photoUrl, aiImageUrl, suggestions } = await getQuoteRequest(id)
  const helmet = quoteHelmetLabels[quote.helmet as QuoteHelmet] ?? quote.helmet

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/quotes", label: "Quote requests" }}
        title={quote.reference}
        description={`Sent ${formatDateTime(quote.createdAt)}${quote.userId ? "" : " by a guest"}`}
        actions={<QuoteStatusBadge status={quote.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <AdminCard title="Customer's photo" flush>
              {photoUrl ? (
                <a href={photoUrl} target="_blank" rel="noreferrer" className="block bg-carbon/5">
                  {/* Signed, short-lived link to a private photo. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt={`Photo sent with ${quote.reference}`} className="aspect-[4/3] w-full object-cover" />
                </a>
              ) : (
                <p className="px-5 py-16 text-center text-sm text-muted-foreground">No photo. They described the design instead.</p>
              )}
            </AdminCard>

            {aiImageUrl && (
              <AdminCard title="AI concept image" flush>
                <a href={aiImageUrl} target="_blank" rel="noreferrer" className="block bg-carbon">
                  {/* Signed, short-lived link to the AI image the customer saw. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aiImageUrl} alt={`AI concept made for ${quote.reference}`} className="aspect-square w-full object-cover" />
                </a>
              </AdminCard>
            )}

            <AdminCard title="Concept" flush>
              <div className="bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_70%)] px-6 py-4">
                {quote.concept.look ? (
                  <HelmetArt look={quote.concept.look} title="Concept the customer saw" className="mx-auto max-h-44" />
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">No concept saved.</p>
                )}
              </div>
              {quote.palette.length > 0 && (
                <ul className="flex flex-wrap gap-1.5 px-5 pt-4" aria-label="Colours">
                  {quote.palette.map((hex) => (
                    <li key={hex} className="flex items-center gap-1.5 rounded-full bg-carbon/[0.05] py-1 pl-1 pr-2.5 text-xs">
                      <span className="size-4 rounded-full ring-1 ring-carbon/15" style={{ backgroundColor: hex }} aria-hidden />
                      {nameColour(hex)} <span className="font-mono text-muted-foreground">{hex}</span>
                    </li>
                  ))}
                </ul>
              )}
              {quote.concept.summary && <p className="p-5 text-sm leading-relaxed">{quote.concept.summary}</p>}
            </AdminCard>
          </div>

          <AdminCard title="What they asked for">
            <dl className="grid gap-4 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
              <dt className="text-muted-foreground">Helmet</dt>
              <dd className="font-medium">{helmet}</dd>
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="whitespace-pre-line">{quote.notes || <span className="text-muted-foreground">None</span>}</dd>
            </dl>
          </AdminCard>

          {suggestions.length > 0 && (
            <AdminCard title="Designs the assistant matched">
              <ul className="grid gap-3 sm:grid-cols-3">
                {suggestions.map((product) => (
                  <li key={product.slug}>
                    <Link
                      href={`/helmet-builder?template=${product.slug}`}
                      target="_blank"
                      className="group block rounded-2xl border border-carbon/10 p-3 transition-colors hover:border-carbon/30"
                    >
                      <span className="block rounded-xl bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_80%)] p-3">
                        <HelmetArt look={product.look} />
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2 font-display text-lg font-bold uppercase">
                        {product.name}
                        <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}
        </div>

        <div className="space-y-6">
          <AdminCard title="Follow up">
            <QuoteUpdateForm id={quote.id} status={quote.status} adminNotes={quote.adminNotes} />
          </AdminCard>

          <AdminCard
            title="Contact"
            action={
              quote.userId ? (
                <Link href={`/admin/customers/${quote.userId}`} className="text-sm font-medium underline-offset-4 hover:underline">
                  View profile
                </Link>
              ) : undefined
            }
          >
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  {quote.name}
                  {!quote.userId && <span className="text-muted-foreground"> (guest)</span>}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <a
                  href={`mailto:${quote.email}?subject=${encodeURIComponent(`Your helmet design (${quote.reference})`)}`}
                  className="break-all underline-offset-4 hover:underline"
                >
                  {quote.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                {quote.phone ? (
                  <a href={`tel:${quote.phone.replace(/\s/g, "")}`} className="underline-offset-4 hover:underline">
                    {quote.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">No phone number</span>
                )}
              </li>
            </ul>
          </AdminCard>
        </div>
      </div>
    </>
  )
}
