import { Suspense } from "react"
import { Plus } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { CategoryDialog } from "@/components/admin/shop/category-dialog"
import { CategoryRowActions } from "@/components/admin/shop/category-row-actions"
import { storeLabels, storeOptions } from "@/components/admin/shop/store-labels"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminShopCategories } from "@/lib/data/shop"
import { cn } from "@/lib/utils"

export const metadata = { title: "Shop categories" }

export default function AdminShopCategoriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[30rem] rounded-2xl" />}>
      <CategoryList />
    </Suspense>
  )
}

async function CategoryList() {
  const categories = await listAdminShopCategories()

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/shop", label: "Shop products" }}
        title="Shop categories"
        description="How products are grouped in each shop. The MS Kart categories also appear in the main menu."
        actions={
          <CategoryDialog
            trigger={
              <Button>
                <Plus /> Add a category
              </Button>
            }
          />
        }
      />
      <div className="space-y-6">
        {storeOptions.map((store) => {
          const rows = categories.filter((category) => category.storeId === store.value)
          return (
            <AdminCard key={store.value} title={storeLabels[store.value]} flush>
              {rows.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">No categories yet.</p>
              ) : (
                <ul className="divide-y divide-carbon/10">
                  {rows.map((category) => (
                    <li key={category.id} className={cn("flex items-center justify-between gap-4 px-5 py-3.5", !category.isActive && "opacity-60")}>
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {category.name}
                          {!category.isActive && <span className="ml-2 text-xs font-normal text-muted-foreground">Hidden</span>}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{category.slug}</p>
                      </div>
                      <CategoryRowActions category={category} />
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          )
        })}
      </div>
    </>
  )
}
