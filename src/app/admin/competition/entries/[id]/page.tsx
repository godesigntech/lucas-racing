import { Suspense } from "react"
import Link from "next/link"
import { ExternalLink, Mail, UserRound } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { EntryReviewForm } from "@/components/admin/competition/entry-review-form"
import { EntryStatusBadge } from "@/components/admin/competition/status-badges"
import { OrderDesign } from "@/components/admin/orders/order-design"
import { Skeleton } from "@/components/ui/skeleton"
import { designHasHydroFilm } from "@/lib/competition/prizes"
import { normaliseConfiguration } from "@/lib/configurator/helmet-configuration"
import { getBuilderCatalog } from "@/lib/data/builder"
import { getCompetitionEntry } from "@/lib/data/competition"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { formatDateTime } from "@/lib/format"
import type { HelmetConfiguration } from "@/types/configurator"

export const metadata = { title: "Competition entry" }

export default function AdminCompetitionEntryPage({ params }: PageProps<"/admin/competition/entries/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
      {params.then(({ id }) => (
        <EntryDetail id={id} />
      ))}
    </Suspense>
  )
}

async function EntryDetail({ id }: { id: string }) {
  const [{ entry, imageUrls, pictureUrl }, products, priceBook, builder] = await Promise.all([getCompetitionEntry(id), getProducts(), getPriceBook(), getBuilderCatalog()])
  const product = products.find((item) => item.slug === entry.productSlug)
  const config = product ? normaliseConfiguration(entry.config, product, priceBook) : null
  const hasFilm = designHasHydroFilm(entry.config as unknown as HelmetConfiguration, priceBook)

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/competition", label: "Competition" }}
        title={entry.designName}
        description={`${entry.reference} · entered ${formatDateTime(entry.createdAt)} · last updated ${formatDateTime(entry.updatedAt)}`}
        actions={<EntryStatusBadge status={entry.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <AdminCard title="Rule checks" description="What the rules ask of every entry. The film and UK confirmation are checked when they enter; check their story yourself (stories only last 24 hours).">
            <div className="grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
              {pictureUrl ? (
                <a href={pictureUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-carbon/5 ring-1 ring-carbon/10">
                  {/* Signed, short-lived link to the picture taken when they entered. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pictureUrl} alt={`Picture of ${entry.designName}`} className="aspect-[4/3] w-full object-cover" />
                </a>
              ) : (
                <p className="grid aspect-[4/3] place-items-center rounded-xl bg-carbon/5 p-3 text-center text-xs text-muted-foreground">No picture with this entry</p>
              )}
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Hydrographic film</dt>
                <dd className={hasFilm ? "" : "font-medium text-destructive"}>{hasFilm ? "Yes" : "None found"}</dd>
                <dt className="text-muted-foreground">Lives in the UK</dt>
                <dd className={entry.ukResident ? "" : "font-medium text-destructive"}>{entry.ukResident ? "Confirmed" : "Not confirmed"}</dd>
                <dt className="text-muted-foreground">Their story</dt>
                <dd className="min-w-0">
                  {entry.postUrl ? (
                    <a href={entry.postUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 font-medium underline-offset-4 hover:underline">
                      <span className="truncate">{entry.postUrl}</span> <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                    </a>
                  ) : (
                    <span className="font-medium text-destructive">No link</span>
                  )}
                </dd>
              </dl>
            </div>
          </AdminCard>
          <AdminCard title={`Design on ${product?.name ?? entry.productSlug}`} description="Exactly as the entrant designed it. Drag to turn the helmet, or pick an angle.">
            {product && config ? (
              <OrderDesign
                product={product}
                config={config}
                priceBook={priceBook}
                templates={builder.templates}
                aeroKits={builder.aeroKits}
                visors={builder.visors}
                logoUrls={imageUrls}
                summary={entry.summary}
              />
            ) : (
              <p className="text-sm text-muted-foreground">The template &ldquo;{entry.productSlug}&rdquo; is no longer in the catalogue, so the 3D view can&apos;t be shown.</p>
            )}
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Judging">
            <EntryReviewForm id={entry.id} status={entry.status} adminNotes={entry.adminNotes} entrantName={entry.name} place={entry.place} />
          </AdminCard>
          <AdminCard
            title="Entrant"
            action={
              <Link href={`/admin/customers/${entry.userId}`} className="text-sm font-medium underline-offset-4 hover:underline">
                View profile
              </Link>
            }
          >
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                {entry.name}
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <a href={`mailto:${entry.email}`} className="break-all underline-offset-4 hover:underline">
                  {entry.email}
                </a>
              </li>
            </ul>
            <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-carbon/10 pt-4 text-xs">
              <dt className="text-muted-foreground">Agreed to rules</dt>
              <dd>{formatDateTime(entry.agreedRulesAt)}</dd>
              <dt className="text-muted-foreground">Marketing emails</dt>
              <dd>{entry.marketingOptIn ? "Yes, opted in" : "No"}</dd>
            </dl>
          </AdminCard>
        </div>
      </div>
    </>
  )
}
