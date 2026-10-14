import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ProductForm } from "@/components/admin/product-form"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminProduct, listAdminHelmetModels } from "@/lib/data/admin"

export const metadata = { title: "Edit product" }

export default function AdminProductPage({ params }: PageProps<"/admin/products/[slug]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
      {params.then(({ slug }) => (
        <ProductEditor slug={slug} />
      ))}
    </Suspense>
  )
}

async function ProductEditor({ slug }: { slug: string }) {
  const [product, models] = await Promise.all([getAdminProduct(slug), listAdminHelmetModels()])

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={product.name}
        description="Changes go live on the website as soon as you save."
      />
      <ProductForm product={product} models={models} />
    </>
  )
}
