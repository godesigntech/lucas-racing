import { Suspense } from "react"
import Link from "next/link"
import { ChevronRight, FolderTree, Newspaper } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { DeleteNewsPostButton } from "@/components/admin/news/delete-news-post-button"
import { NewNewsPostDialog } from "@/components/admin/news/new-news-post-dialog"
import { Pagination } from "@/components/admin/pagination"
import { SearchInput } from "@/components/admin/search-input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ADMIN_PAGE_SIZE } from "@/lib/data/admin"
import { listAdminNews } from "@/lib/data/news"
import { formatDate } from "@/lib/format"
import { isFuture } from "@/lib/news/text"
import { cn } from "@/lib/utils"
import type { NewsPost } from "@/types/news"

export const metadata = { title: "News" }

type Query = { q?: string; status?: string; page?: string }

function buildHref(query: Query, changes: Partial<Query>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...query, ...changes })) if (value) params.set(key, value)
  const search = params.toString()
  return search ? `/admin/news?${search}` : "/admin/news"
}

function statusOf(post: NewsPost): { label: string; className: string } {
  if (post.status === "draft") return { label: "Draft", className: "bg-carbon/10 text-carbon" }
  if (isFuture(post.publishedAt)) return { label: "Scheduled", className: "bg-amber-100 text-amber-900" }
  return { label: "Published", className: "bg-emerald-100 text-emerald-900" }
}

export default function AdminNewsPage({ searchParams }: PageProps<"/admin/news">) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
      {searchParams.then((params) => (
        <NewsList query={params as Query} />
      ))}
    </Suspense>
  )
}

async function NewsList({ query }: { query: Query }) {
  const status = ["published", "scheduled", "draft"].includes(query.status ?? "") ? query.status : ""
  const result = await listAdminNews({ status, query: query.q, page: Number(query.page) || 1 })

  return (
    <>
      <AdminPageHeader
        title="News"
        description="Race reports, results and team news. Write in drafts, publish now or schedule for later."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/news/categories">
                <FolderTree /> Categories
              </Link>
            </Button>
            <NewNewsPostDialog />
          </>
        }
      />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs
            label="Filter by status"
            active={status ?? ""}
            hrefFor={(value) => buildHref(query, { status: value || undefined, page: undefined })}
            tabs={[
              { value: "", label: "All posts" },
              { value: "published", label: "Published" },
              { value: "scheduled", label: "Scheduled" },
              { value: "draft", label: "Drafts" },
            ]}
          />
          <Suspense fallback={<Skeleton className="h-10 w-full rounded-full sm:max-w-xs" />}>
            <SearchInput label="Search posts" placeholder="Title or summary" />
          </Suspense>
        </div>
        <AdminCard flush>
          {result.rows.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Newspaper className="mx-auto size-8 text-muted-foreground" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">{query.q || status ? "No posts match these filters." : "No posts yet. Write the first one."}</p>
            </div>
          ) : (
            <ul className="divide-y divide-carbon/10">
              {result.rows.map((post) => {
                const badge = statusOf(post)
                return (
                  <li key={post.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="hidden size-14 shrink-0 overflow-hidden rounded-lg bg-carbon/5 sm:block">
                      {post.coverUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                        <img src={post.coverUrl} alt="" className="size-full object-cover" />
                      )}
                    </span>
                    <Link href={`/admin/news/${post.id}`} className="group min-w-0 flex-1">
                      <p className="truncate font-semibold group-hover:underline">{post.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className={cn("rounded-full px-2 py-0.5 font-semibold", badge.className)}>{badge.label}</span>
                        {post.category && <span>{post.category.name}</span>}
                        <span>{post.publishedAt ? formatDate(post.publishedAt) : `Edited ${formatDate(post.updatedAt)}`}</span>
                        {post.featured && <span className="font-semibold text-brand-ink">Featured</span>}
                      </p>
                    </Link>
                    <DeleteNewsPostButton id={post.id} title={post.title} compact />
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </li>
                )
              })}
            </ul>
          )}
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={ADMIN_PAGE_SIZE}
            noun="posts"
            hrefFor={(page) => buildHref(query, { page: String(page) })}
          />
        </AdminCard>
      </div>
    </>
  )
}
