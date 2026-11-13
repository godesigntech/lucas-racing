import { Suspense } from "react"
import { staffShop } from "@/lib/auth/roles"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DeleteShopProductButton } from "@/components/admin/shop/delete-shop-product-button"
import { PartPreviewEditor } from "@/components/admin/shop/part-preview-editor"
import { ProductImagesManager } from "@/components/admin/shop/product-images-manager"
import { ShopProductForm } from "@/components/admin/shop/shop-product-form"
import { StockHistory } from "@/components/admin/shop/stock-history"
import { storeLabels } from "@/components/admin/shop/store-labels"
import { VariantsManager } from "@/components/admin/shop/variants-manager"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { requireShopManager } from "@/lib/auth/session"
import { getPriceBook } from "@/lib/data/products"
import { getAdminShopProduct, listAdminShopCategories } from "@/lib/data/shop"
import { isCustomisable, productHref } from "@/lib/shop/part-finish"

export const metadata = { title: "Shop product" }

export default function AdminShopProductPage({ params }: PageProps<"/admin/shop/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
      {params.then(({ id }) => (
        <ProductEditor id={id} />
      ))}
    </Suspense>
  )
}

async function ProductEditor({ id }: { id: string }) {
  const [user, { product, movements }, categories, priceBook] = await Promise.all([
    requireShopManager(),
    getAdminShopProduct(id),
    listAdminShopCategories(),
    getPriceBook(),
  ])
  const customPart = product.storeId === "hydrokarts-parts" && isCustomisable(product)

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/shop", label: "Shop products" }}
        title={product.title}
        description={`${storeLabels[product.storeId]} · ${product.isActive ? "On sale" : "Hidden from the shop"}${product.storeId === "delta" ? ` · ${product.externalClicks} ${product.externalClicks === 1 ? "click" : "clicks"} to Delta` : ""}`}
        actions={
          <>
            {product.isActive && product.storeId !== "delta" && (
              <Button asChild variant="outline">
                <Link href={productHref(product)} target="_blank">
                  <ExternalLink /> View in shop
                </Link>
              </Button>
            )}
            <DeleteShopProductButton id={product.id} title={product.title} />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <AdminCard title="Options, prices and stock" description="Each size, colour or part number is an option with its own price and stock.">
            <VariantsManager product={product} />
          </AdminCard>
          {customPart && (
            <AdminCard
              title="Live preview"
              description="How customers see their paint, film or chrome on this part. Mark the area that gets the finish and save."
            >
              <PartPreviewEditor product={product} priceBook={priceBook} />
            </AdminCard>
          )}
          <AdminCard title="Details">
            <ShopProductForm product={product} categories={categories} stores={staffShop(user.role) ? [staffShop(user.role)!] : undefined} />
          </AdminCard>
        </div>
        <div className="space-y-6">
          <AdminCard title="Photos">
            <ProductImagesManager productId={product.id} images={product.images} />
          </AdminCard>
          <AdminCard title="Stock history" description="The latest 30 changes.">
            <StockHistory movements={movements} variants={product.variants} />
          </AdminCard>
        </div>
      </div>
    </>
  )
}
