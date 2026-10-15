import { Suspense } from "react"
import { Inbox } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { EnquiryCard } from "@/components/admin/enquiries/enquiry-card"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { Pagination } from "@/components/admin/pagination"
import { SearchInput } from "@/components/admin/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { ADMIN_PAGE_SIZE } from "@/lib/data/admin"
import { listEnquiries } from "@/lib/data/enquiries"
import { getProducts } from "@/lib/data/products"
import { contactTopics } from "@/lib/validations/contact"
import { enquiryStatuses } from "@/types/enquiry"

export const metadata = { title: "Enquiries" }

type Query = { q?: string; status?: string; page?: string }

const statusLabels = { new: "New", replied: "Replied", closed: "Closed" } as const

function buildHref(query: Query, changes: Partial<Query>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...query, ...changes })) if (value) params.set(key, value)
  const search = params.toString()
  return search ? `/admin/enquiries?${search}` : "/admin/enquiries"
}

export default function AdminEnquiriesPage({ searchParams }: PageProps<"/admin/enquiries">) {
  return (
    <>
      <AdminPageHeader
        title="Enquiries"
        description="Messages from the contact form. Reply by email, then mark them replied or closed."
      />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        {searchParams.then((params) => (
          <EnquiryList query={params as Query} />
        ))}
      </Suspense>
    </>
  )
}

async function EnquiryList({ query }: { query: Query }) {
  const status = typeof query.status === "string" ? query.status : "new"
  const [result, products] = await Promise.all([
    listEnquiries({ status: status === "all" ? "" : status, query: query.q, page: Number(query.page) || 1 }),
    getProducts(),
  ])
  const total = Object.values(result.counts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          label="Filter by status"
          active={status}
          hrefFor={(value) => buildHref(query, { status: value, page: undefined })}
          tabs={[
            ...enquiryStatuses.map((value) => ({ value, label: statusLabels[value], count: result.counts[value] })),
            { value: "all", label: "All", count: total },
          ]}
        />
        <Suspense fallback={<Skeleton className="h-10 w-full rounded-full sm:max-w-xs" />}>
          <SearchInput label="Search enquiries" placeholder="Name, email or message" />
        </Suspense>
      </div>

      {result.rows.length === 0 ? (
        <AdminCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <Inbox className="size-8 text-carbon/25" aria-hidden />
            {query.q ? "No enquiries match that search." : status === "new" ? "You're all caught up. No new enquiries." : "Nothing here yet."}
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {result.rows.map((enquiry) => (
            <EnquiryCard
              key={enquiry.id}
              enquiry={enquiry}
              topicLabel={contactTopics.find((topic) => topic.value === enquiry.topic)?.label ?? enquiry.topic}
              designName={products.find((product) => product.slug === enquiry.design)?.name}
            />
          ))}
        </div>
      )}

      {result.pageCount > 1 && (
        <AdminCard flush>
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={ADMIN_PAGE_SIZE}
            noun="enquiries"
            hrefFor={(page) => buildHref(query, { page: String(page) })}
          />
        </AdminCard>
      )}
    </div>
  )
}
