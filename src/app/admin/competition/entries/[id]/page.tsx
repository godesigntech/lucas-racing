import { Suspense } from "react"
import Link from "next/link"
import { Mail, UserRound } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { EntryReviewForm } from "@/components/admin/competition/entry-review-form"
import { EntryStatusBadge } from "@/components/admin/competition/status-badges"
import { OrderDesign } from "@/components/admin/orders/order-design"
import { Skeleton } from "@/components/ui/skeleton"
import { normaliseConfiguration } from "@/lib/configurator/helmet-configuration"
import { getBuilderCatalog } from "@/lib/data/builder"
import { getCompetitionEntry } from "@/lib/data/competition"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { formatDateTime } from "@/lib/format"

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
  const [{ entry, imageUrls }, products, priceBook, builder] = await Promise.all([getCompetitionEntry(id), getProducts(), getPriceBook(), getBuilderCatalog()])
  const product = products.find((item) => item.slug === entry.productSlug)
  const config = product ? normaliseConfiguration(entry.config, product, priceBook) : null

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/competition", label: "Competition" }}
        title={entry.designName}
        description={`${entry.reference} · entered ${formatDateTime(entry.createdAt)} · last updated ${formatDateTime(entry.updatedAt)}`}
        actions={<EntryStatusBadge status={entry.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
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
            <EntryReviewForm id={entry.id} status={entry.status} adminNotes={entry.adminNotes} entrantName={entry.name} />
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
