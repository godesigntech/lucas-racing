import { Suspense } from "react"
import { Plus } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FilmActiveSwitch } from "@/components/admin/film-active-switch"
import { FilmCategoryPricing } from "@/components/admin/film-category-pricing"
import { FilmDialog } from "@/components/admin/film-dialog"
import { FilmRowActions } from "@/components/admin/film-row-actions"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { Pagination } from "@/components/admin/pagination"
import { SearchInput } from "@/components/admin/search-input"
import { FilmSwatch } from "@/components/helmet/film-swatch"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ADMIN_PAGE_SIZE, listAdminFilms } from "@/lib/data/admin"
import { formatMoney } from "@/lib/format"
import type { Film } from "@/types/catalog"

export const metadata = { title: "Films" }

type Query = { q?: string; category?: string; page?: string }

function buildHref(query: Query, changes: Partial<Query>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...query, ...changes })) if (value) params.set(key, value)
  const search = params.toString()
  return search ? `/admin/films?${search}` : "/admin/films"
}

export default function AdminFilmsPage({ searchParams }: PageProps<"/admin/films">) {
  return (
    <>
      <AdminPageHeader
        title="Films"
        description="The in-stock hydro-dip films customers choose from. A film's price is added to the helmet."
        actions={
          <FilmDialog
            trigger={
              <Button>
                <Plus /> Add film
              </Button>
            }
          />
        }
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        {searchParams.then((params) => (
          <FilmLibrary query={params as Query} />
        ))}
      </Suspense>
    </>
  )
}

function FilmThumb({ film }: { film: Film }) {
  if (film.thumbUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- 160px static thumbnail
    return <img src={film.thumbUrl} alt="" loading="lazy" className="size-full object-cover" />
  }
  if (film.pattern === "none") return <span className="block size-full bg-gradient-to-br from-zinc-200 to-zinc-400" />
  return <FilmSwatch film={film.pattern} tint="#6b7280" />
}

async function FilmLibrary({ query }: { query: Query }) {
  const category = typeof query.category === "string" ? query.category : ""
  const result = await listAdminFilms({ category, query: query.q, page: Number(query.page) || 1 })
  const total = result.categories.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3">
          <FilterTabs
            label="Filter by category"
            active={category}
            hrefFor={(value) => buildHref(query, { category: value || undefined, page: undefined })}
            tabs={[
              { value: "", label: "All", count: total },
              ...result.categories.map((item) => ({ value: item.name, label: item.name, count: item.count })),
            ]}
          />
          <Suspense fallback={<Skeleton className="h-10 w-full rounded-full sm:max-w-xs" />}>
            <SearchInput label="Search films" placeholder="Film code, e.g. TSWD2232" />
          </Suspense>
        </div>

        <AdminCard flush>
          {result.rows.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">No films match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[36rem]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Film</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="pr-5 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((film) => (
                    <TableRow key={film.id}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <span className="size-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-carbon/10">
                            <FilmThumb film={film} />
                          </span>
                          <div>
                            <p className="font-semibold">{film.code || film.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {film.widths.length ? `Roll ${film.widths.join(" / ")}` : film.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{film.category}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {film.price ? formatMoney(film.price) : <span className="font-normal text-muted-foreground">Free</span>}
                      </TableCell>
                      <TableCell>
                        <FilmActiveSwitch film={film} />
                      </TableCell>
                      <TableCell className="pr-5">
                        <FilmRowActions film={film} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={ADMIN_PAGE_SIZE}
            noun="films"
            hrefFor={(page) => buildHref(query, { page: String(page) })}
          />
        </AdminCard>
      </div>

      <AdminCard title="Price by category" description="Set one price for every film in a category. You can still change single films.">
        <div className="-m-5">
          <FilmCategoryPricing categories={result.categories.filter((item) => item.name !== "Solid")} />
        </div>
      </AdminCard>
    </div>
  )
}
