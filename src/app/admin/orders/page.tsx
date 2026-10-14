import { Suspense } from "react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { OrdersTable } from "@/components/admin/orders-table"
import { Pagination } from "@/components/admin/pagination"
import { SearchInput } from "@/components/admin/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { ADMIN_PAGE_SIZE, listOrders } from "@/lib/data/admin"
import { orderStatusMeta } from "@/lib/orders/status"
import { orderStatuses } from "@/types/order"

export const metadata = { title: "Orders" }

type Query = { q?: string; status?: string; page?: string }

function buildHref(query: Query, changes: Partial<Query>) {
  const params = new URLSearchParams()
  const next = { ...query, ...changes }
  for (const [key, value] of Object.entries(next)) if (value) params.set(key, value)
  const search = params.toString()
  return search ? `/admin/orders?${search}` : "/admin/orders"
}

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <AdminPageHeader title="Orders" description="Every order placed through the website. Open one to update its status." />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        {searchParams.then((params) => (
          <OrdersList query={params as Query} />
        ))}
      </Suspense>
    </>
  )
}

async function OrdersList({ query }: { query: Query }) {
  const status = typeof query.status === "string" ? query.status : ""
  const result = await listOrders({ query: query.q, status, page: Number(query.page) || 1 })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          label="Filter by status"
          active={status}
          hrefFor={(value) => buildHref(query, { status: value || undefined, page: undefined })}
          tabs={[{ value: "", label: "All" }, ...orderStatuses.map((value) => ({ value, label: orderStatusMeta[value].label }))]}
        />
        <Suspense fallback={<Skeleton className="h-10 w-full rounded-full sm:max-w-xs" />}>
          <SearchInput label="Search orders" placeholder="Order number, name or email" />
        </Suspense>
      </div>
      <AdminCard flush>
        <OrdersTable
          orders={result.rows}
          emptyMessage={query.q || status ? "No orders match these filters." : "No orders yet."}
        />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={ADMIN_PAGE_SIZE}
          noun="orders"
          hrefFor={(page) => buildHref(query, { page: String(page) })}
        />
      </AdminCard>
    </div>
  )
}
