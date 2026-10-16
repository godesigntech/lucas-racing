import { Suspense } from "react"
import Link from "next/link"
import { FolderTree } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { Pagination } from "@/components/admin/pagination"
import { SearchInput } from "@/components/admin/search-input"
import { NewShopProductDialog } from "@/components/admin/shop/new-shop-product-dialog"
import { ShopProductsTable } from "@/components/admin/shop/shop-products-table"
import { storeOptions } from "@/components/admin/shop/store-labels"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ADMIN_PAGE_SIZE } from "@/lib/data/admin"
import { listAdminShopProducts } from "@/lib/data/shop"
import { storeIds } from "@/lib/validations/shop"
import type { StoreId } from "@/types/shop"

export const metadata = { title: "Shop products" }

type Query = { q?: string; store?: string; stock?: string; page?: string }

function buildHref(query: Query, changes: Partial<Query>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...query, ...changes })) if (value) params.set(key, value)
  const search = params.toString()
  return search ? `/admin/shop?${search}` : "/admin/shop"
}

export default function AdminShopPage({ searchParams }: PageProps<"/admin/shop">) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
      {searchParams.then((params) => (
        <ShopList query={params as Query} />
      ))}
    </Suspense>
  )
}

async function ShopList({ query }: { query: Query }) {
  const store = (storeIds as readonly string[]).includes(query.store ?? "") ? (query.store as StoreId) : undefined
  const stock = query.stock === "low" || query.stock === "out" ? query.stock : ""
  const result = await listAdminShopProducts({ store, stock, query: query.q, page: Number(query.page) || 1 })

  return (
    <>
      <AdminPageHeader
        title="Shop products"
        description="Products for the MS Kart shop, Teamwear, HydroKarts parts and Delta Racewear, with their options, prices and stock."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/shop/categories">
                <FolderTree /> Categories
              </Link>
            </Button>
            <NewShopProductDialog defaultStore={store} />
          </>
        }
      />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs
            label="Filter by shop"
            active={store ?? ""}
            hrefFor={(value) => buildHref(query, { store: value || undefined, page: undefined })}
            tabs={[{ value: "", label: "All shops" }, ...storeOptions]}
          />
          <Suspense fallback={<Skeleton className="h-10 w-full rounded-full sm:max-w-xs" />}>
            <SearchInput label="Search products" placeholder="Name, brand or web address" />
          </Suspense>
        </div>
        <FilterTabs
          label="Filter by stock"
          active={stock}
          hrefFor={(value) => buildHref(query, { stock: value || undefined, page: undefined })}
          tabs={[
            { value: "", label: "Any stock" },
            { value: "low", label: "Low stock" },
            { value: "out", label: "Out of stock" },
          ]}
        />
        <AdminCard flush>
          <ShopProductsTable
            products={result.rows}
            emptyMessage={
              query.q || store || stock ? "No products match these filters." : "No products yet. Add the first one, or import them once the MS Kart data arrives."
            }
          />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={ADMIN_PAGE_SIZE}
            noun="products"
            hrefFor={(page) => buildHref(query, { page: String(page) })}
          />
        </AdminCard>
      </div>
    </>
  )
}
