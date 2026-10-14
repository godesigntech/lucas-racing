import { Suspense } from "react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { Pagination } from "@/components/admin/pagination"
import { QuotesTable } from "@/components/admin/quotes/quotes-table"
import { SearchInput } from "@/components/admin/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { ADMIN_PAGE_SIZE } from "@/lib/data/admin"
import { listQuoteRequests } from "@/lib/data/quotes"
import { quoteStatusMeta } from "@/lib/quotes/status"
import { quoteStatuses } from "@/types/design-assistant"

export const metadata = { title: "Quote requests" }

type Query = { q?: string; status?: string; page?: string }

function buildHref(query: Query, changes: Partial<Query>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...query, ...changes })) if (value) params.set(key, value)
  const search = params.toString()
  return search ? `/admin/quotes?${search}` : "/admin/quotes"
}

export default function AdminQuotesPage({ searchParams }: PageProps<"/admin/quotes">) {
  return (
    <>
      <AdminPageHeader
        title="Quote requests"
        description="Sent from the design assistant by guests and customers. Each one has their photo, the concept and the designs it matched."
      />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        {searchParams.then((params) => (
          <QuotesList query={params as Query} />
        ))}
      </Suspense>
    </>
  )
}

async function QuotesList({ query }: { query: Query }) {
  const status = typeof query.status === "string" ? query.status : ""
  const result = await listQuoteRequests({ status, query: query.q, page: Number(query.page) || 1 })
  const total = Object.values(result.counts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          label="Filter by status"
          active={status}
          hrefFor={(value) => buildHref(query, { status: value || undefined, page: undefined })}
          tabs={[
            { value: "", label: "All", count: total },
            ...quoteStatuses.map((value) => ({ value, label: quoteStatusMeta[value].label, count: result.counts[value] })),
          ]}
        />
        <Suspense fallback={<Skeleton className="h-10 w-full rounded-full sm:max-w-xs" />}>
          <SearchInput label="Search quote requests" placeholder="Reference, name or email" />
        </Suspense>
      </div>
      <AdminCard flush>
        <QuotesTable
          quotes={result.rows}
          emptyMessage={query.q || status ? "No quote requests match these filters." : "No quote requests yet."}
        />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={ADMIN_PAGE_SIZE}
          noun="requests"
          hrefFor={(page) => buildHref(query, { page: String(page) })}
        />
      </AdminCard>
    </div>
  )
}
