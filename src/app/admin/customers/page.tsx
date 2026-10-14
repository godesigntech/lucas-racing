import { Suspense } from "react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { CustomersTable } from "@/components/admin/customers-table"
import { Pagination } from "@/components/admin/pagination"
import { SearchInput } from "@/components/admin/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { ADMIN_PAGE_SIZE, listCustomers } from "@/lib/data/admin"

export const metadata = { title: "Customers" }

type Query = { q?: string; page?: string }

export default function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <>
      <AdminPageHeader title="Customers" description="Everyone with an account, with their order history and spend." />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        {searchParams.then((params) => (
          <CustomerList query={params as Query} />
        ))}
      </Suspense>
    </>
  )
}

async function CustomerList({ query }: { query: Query }) {
  const result = await listCustomers({ query: query.q, page: Number(query.page) || 1 })
  const hrefFor = (page: number) => {
    const params = new URLSearchParams()
    if (query.q) params.set("q", query.q)
    params.set("page", String(page))
    return `/admin/customers?${params.toString()}`
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<Skeleton className="h-10 w-full rounded-full sm:max-w-xs" />}>
        <SearchInput label="Search customers" placeholder="Name, email or postcode" />
      </Suspense>
      <AdminCard flush>
        <CustomersTable
          customers={result.rows}
          emptyMessage={query.q ? "No customers match that search." : "No customers yet. They appear here when they sign up."}
        />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={ADMIN_PAGE_SIZE}
          noun="customers"
          hrefFor={hrefFor}
        />
      </AdminCard>
    </div>
  )
}
