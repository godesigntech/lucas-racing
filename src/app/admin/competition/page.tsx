import { Suspense } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { CompetitionSettingsForm } from "@/components/admin/competition/competition-settings-form"
import { EntriesTable } from "@/components/admin/competition/entries-table"
import { CompetitionStatusBadge } from "@/components/admin/competition/status-badges"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { Pagination } from "@/components/admin/pagination"
import { SearchInput } from "@/components/admin/search-input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { entryStatusMeta, formatClosing } from "@/lib/competition/status"
import { ADMIN_PAGE_SIZE } from "@/lib/data/admin"
import { getAdminCompetition, listCompetitionEntries } from "@/lib/data/competition"
import { getProducts } from "@/lib/data/products"
import { entryStatuses, type Competition } from "@/types/competition"

export const metadata = { title: "Competition" }

type Query = { tab?: string; q?: string; status?: string; page?: string }

function buildHref(query: Query, changes: Partial<Query>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...query, ...changes })) if (value) params.set(key, value)
  const search = params.toString()
  return search ? `/admin/competition?${search}` : "/admin/competition"
}

export default function AdminCompetitionPage({ searchParams }: PageProps<"/admin/competition">) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
      {searchParams.then((params) => (
        <CompetitionAdmin query={params as Query} />
      ))}
    </Suspense>
  )
}

async function CompetitionAdmin({ query }: { query: Query }) {
  const competition = await getAdminCompetition()
  if (!competition) {
    return <AdminPageHeader title="Competition" description="No competition has been set up yet." />
  }
  const tab = query.tab === "settings" ? "settings" : "entries"

  return (
    <>
      <AdminPageHeader
        title="Competition"
        description={`${competition.title}${competition.closesAt ? ` · entries close ${formatClosing(competition.closesAt)}` : ""}`}
        actions={
          <>
            <CompetitionStatusBadge status={competition.status} />
            <Button asChild variant="outline" size="sm">
              <Link href="/competition" target="_blank">
                View page <ExternalLink aria-hidden />
              </Link>
            </Button>
          </>
        }
      />
      <div className="mb-4">
        <FilterTabs
          label="Competition sections"
          active={tab}
          hrefFor={(value) => (value === "settings" ? "/admin/competition?tab=settings" : "/admin/competition")}
          tabs={[
            { value: "entries", label: "Entries" },
            { value: "settings", label: "Settings" },
          ]}
        />
      </div>
      {tab === "settings" ? (
        <AdminCard title="Settings" description="Everything here shows on the competition page straight away. Open entries once the rules and closing date are in.">
          <CompetitionSettingsForm competition={competition} />
        </AdminCard>
      ) : (
        <Entries competition={competition} query={query} />
      )}
    </>
  )
}

async function Entries({ competition, query }: { competition: Competition; query: Query }) {
  const status = typeof query.status === "string" ? query.status : ""
  const [result, products] = await Promise.all([
    listCompetitionEntries(competition.id, { status, query: query.q, page: Number(query.page) || 1 }),
    getProducts(),
  ])
  const total = Object.values(result.counts).reduce((sum, count) => sum + count, 0)
  const templateNames = Object.fromEntries(products.map((product) => [product.slug, product.name]))

  return (
    <div className="space-y-4">
      {competition.status === "upcoming" && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Entries aren&apos;t open yet. Add the rules and closing date in{" "}
          <Link href="/admin/competition?tab=settings" className="font-semibold underline underline-offset-2">
            Settings
          </Link>
          , then set the status to Open for entries.
        </p>
      )}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          label="Filter by status"
          active={status}
          hrefFor={(value) => buildHref(query, { status: value || undefined, page: undefined })}
          tabs={[
            { value: "", label: "All", count: total },
            ...entryStatuses.map((value) => ({ value, label: entryStatusMeta[value].label, count: result.counts[value] })),
          ]}
        />
        <Suspense fallback={<Skeleton className="h-10 w-full rounded-full sm:max-w-xs" />}>
          <SearchInput label="Search entries" placeholder="Reference, name, email or design" />
        </Suspense>
      </div>
      <AdminCard flush>
        <EntriesTable
          entries={result.rows}
          templateNames={templateNames}
          emptyMessage={query.q || status ? "No entries match these filters." : "No entries yet."}
        />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={ADMIN_PAGE_SIZE}
          noun="entries"
          hrefFor={(page) => buildHref(query, { page: String(page) })}
        />
      </AdminCard>
    </div>
  )
}
