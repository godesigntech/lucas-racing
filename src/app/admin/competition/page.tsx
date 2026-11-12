import { Suspense } from "react"
import Link from "next/link"
import { Download, ExternalLink } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { CompetitionSettingsForm } from "@/components/admin/competition/competition-settings-form"
import { EntriesTable } from "@/components/admin/competition/entries-table"
import { DeleteEntriesButton, IssueVouchersButton } from "@/components/admin/competition/prize-actions"
import { CompetitionStatusBadge } from "@/components/admin/competition/status-badges"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { Pagination } from "@/components/admin/pagination"
import { SearchInput } from "@/components/admin/search-input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { entryStatusMeta, formatClosing } from "@/lib/competition/status"
import { ADMIN_PAGE_SIZE } from "@/lib/data/admin"
import { getAdminCompetition, getCompetitionPictures, getCompetitionVoucherCounts, listCompetitionEntries } from "@/lib/data/competition"
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
  const tab = query.tab === "settings" ? "settings" : query.tab === "prizes" ? "prizes" : "entries"

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
          hrefFor={(value) => (value === "entries" ? "/admin/competition" : `/admin/competition?tab=${value}`)}
          tabs={[
            { value: "entries", label: "Entries" },
            { value: "prizes", label: "Vote & prizes" },
            { value: "settings", label: "Settings" },
          ]}
        />
      </div>
      {tab === "prizes" ? (
        <VoteAndPrizes competition={competition} />
      ) : tab === "settings" ? (
        <AdminCard title="Settings" description="Everything here shows on the competition page straight away. Open entries once the rules and closing date are in.">
          <CompetitionSettingsForm competition={competition} />
        </AdminCard>
      ) : (
        <Entries competition={competition} query={query} />
      )}
    </>
  )
}

/**
 * After entries close: the numbered pictures for the anonymous Facebook vote, then the
 * places and vouchers, then deleting the entry records as the rules promise.
 */
async function VoteAndPrizes({ competition }: { competition: Competition }) {
  const [pictures, vouchers] = await Promise.all([getCompetitionPictures(competition.id), getCompetitionVoucherCounts(competition.id)])
  const judged = competition.status === "judged"
  const missing = pictures.filter((picture) => !picture.url).length

  return (
    <div className="space-y-6">
      <AdminCard
        title="1. Pictures for the vote"
        description={`Every eligible entry (${pictures.length}), numbered and without names, to post on Facebook. Disqualified entries are left out. Open an entry to see whose it is.`}
        action={
          pictures.length > 0 ? (
            <Button asChild size="sm" variant="outline">
              <a href="/admin/competition/pictures" download>
                <Download aria-hidden /> Download all
              </a>
            </Button>
          ) : undefined
        }
      >
        {pictures.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        ) : (
          <>
            {missing > 0 && (
              <p className="mb-3 text-xs text-muted-foreground">
                {missing} {missing === 1 ? "entry has" : "entries have"} no picture (entered before pictures were taken). Open the entry to see the design in 3D.
              </p>
            )}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {pictures.map((picture) => (
                <li key={picture.entryId}>
                  <Link href={`/admin/competition/entries/${picture.entryId}`} className="group block">
                    <span className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-carbon/5 ring-1 ring-carbon/10 transition group-hover:ring-carbon/30">
                      {picture.url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived link to a private picture
                        <img src={picture.url} alt={`Design ${picture.number}`} className="size-full object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No picture</span>
                      )}
                    </span>
                    <span className="mt-1 block text-center text-xs font-semibold">Design {picture.number}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminCard>

      <AdminCard
        title="2. Places and vouchers"
        description="When the vote closes, open the winning entry and choose it as the winner, and set 2nd to 5th on their entries. Then issue the vouchers: 2nd 50%, 3rd 40%, 4th 30%, 5th 20%, every other eligible entrant 10%, each valid for 12 months and emailed with its code."
      >
        <div className="flex flex-wrap items-center gap-3">
          <IssueVouchersButton competitionId={competition.id} disabled={!judged} />
          <p className="text-sm text-muted-foreground">
            {judged ? `${vouchers.issued} issued, ${vouchers.used} used so far.` : "Choose the winner first."}
          </p>
        </div>
      </AdminCard>

      <AdminCard
        title="3. Delete entry records"
        description="The rules promise to delete entry records once prizes and vouchers are issued. Vouchers and the winner's announcement are kept."
      >
        <DeleteEntriesButton competitionId={competition.id} disabled={!judged || vouchers.issued === 0} />
      </AdminCard>
    </div>
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
