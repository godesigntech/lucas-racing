import { Suspense } from "react"
import Link from "next/link"
import { ExternalLink, Plus } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { NewsCategoryDialog } from "@/components/admin/news/news-category-dialog"
import { NewsCategoryRowActions } from "@/components/admin/news/news-category-row-actions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminNewsCategories } from "@/lib/data/news"

export const metadata = { title: "News categories" }

export default function AdminNewsCategoriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[30rem] rounded-2xl" />}>
      <CategoryList />
    </Suspense>
  )
}

async function CategoryList() {
  const categories = await listAdminNewsCategories()

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/news", label: "News" }}
        title="News categories"
        description="Group posts by topic. Each category has its own page on the website."
        actions={
          <NewsCategoryDialog
            trigger={
              <Button>
                <Plus /> Add a category
              </Button>
            }
          />
        }
      />
      <AdminCard flush>
        {categories.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-carbon/10">
            {categories.map((category) => (
              <li key={category.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {category.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {category.postCount} published {category.postCount === 1 ? "post" : "posts"}
                    </span>
                  </p>
                  <Link
                    href={`/news/category/${category.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-carbon"
                  >
                    /news/category/{category.slug} <ExternalLink className="size-3" aria-hidden />
                  </Link>
                </div>
                <NewsCategoryRowActions category={category} />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  )
}
