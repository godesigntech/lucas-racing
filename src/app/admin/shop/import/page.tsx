import { Suspense } from "react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ProductImport } from "@/components/admin/shop/product-import"
import { storeLabels } from "@/components/admin/shop/store-labels"
import { Skeleton } from "@/components/ui/skeleton"
import { requireFullAdmin } from "@/lib/auth/session"
import { listImportRuns } from "@/lib/data/shop"
import { formatDateTime } from "@/lib/format"

export const metadata = { title: "Import products" }

export default function AdminShopImportPage() {
  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/shop", label: "Shop products" }}
        title="Import products"
        description="Add and update products from a supplier's CSV file. Matching products are updated, new ones are added, and your own changes are kept."
      />
      <div className="space-y-6">
        <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
          <ImportForm />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
          <ImportHistory />
        </Suspense>
      </div>
    </>
  )
}

async function ImportForm() {
  await requireFullAdmin()
  return <ProductImport />
}

async function ImportHistory() {
  const runs = await listImportRuns()

  return (
    <AdminCard title="Recent imports" flush>
      {runs.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">No imports yet.</p>
      ) : (
        <ul className="divide-y divide-carbon/10">
          {runs.map((run) => (
            <li key={run.id} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{run.fileName || "CSV file"}</p>
                <p className="text-xs text-muted-foreground">
                  {storeLabels[run.storeId] ?? run.storeId} · {formatDateTime(run.createdAt)}
                  {run.fullCatalogue && " · Full catalogue"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {run.counts.created} added · {run.counts.updated} updated · {run.counts.unchanged} unchanged
                {run.counts.hidden > 0 && ` · ${run.counts.hidden} hidden`}
                {run.errors.length > 0 && <span className="text-amber-900"> · {run.errors.length} problems</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  )
}
