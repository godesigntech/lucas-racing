import { Suspense } from "react"
import Link from "next/link"
import { Box, Pencil } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { NewProductDialog } from "@/components/admin/new-product-dialog"
import { ProductActiveSwitch } from "@/components/admin/product-active-switch"
import { HelmetArt } from "@/components/helmet/helmet-art"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCategory } from "@/lib/catalog/categories"
import { listAdminProducts } from "@/lib/data/admin"
import { getAdminBuilderCatalog } from "@/lib/data/builder-admin"
import { formatMoney } from "@/lib/format"

export const metadata = { title: "Templates" }

export default function AdminBuilderTemplatesPage() {
  return (
    <>
      <AdminPageHeader
        title="Step 3 · Templates"
        description="The designs customers start from. Edit a template's name, starting price and photos, switch it on or off, and check its 3D artwork for each helmet."
        actions={<NewProductDialog />}
      />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        <TemplateList />
      </Suspense>
    </>
  )
}

async function TemplateList() {
  const [products, { templates }] = await Promise.all([listAdminProducts(), getAdminBuilderCatalog()])

  return (
    <AdminCard flush>
      <div className="overflow-x-auto">
        <Table className="min-w-[48rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Template</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Starting price</TableHead>
              <TableHead>3D artwork</TableHead>
              <TableHead>Live</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const artwork = templates.filter((template) => template.productSlug === product.slug)
              const ready = artwork.filter((template) => template.artworkStatus === "ready").length
              return (
                <TableRow key={product.id}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-smoke p-1">
                        <HelmetArt look={product.look} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{product.name}</p>
                        <p className="max-w-56 truncate text-xs text-muted-foreground">{product.tagline}</p>
                      </div>
                      {product.badge && <Badge variant="secondary">{product.badge}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{getCategory(product.category).label}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {product.startingPrice === null ? (
                      <span className="font-normal text-muted-foreground">Not set</span>
                    ) : (
                      formatMoney(product.startingPrice)
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {artwork.length === 0 ? "None yet" : `${ready} of ${artwork.length} helmets ready`}
                  </TableCell>
                  <TableCell>
                    <ProductActiveSwitch productId={product.id} name={product.name} isActive={product.isActive} />
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/products/${product.slug}`}>
                          <Pencil /> Details
                        </Link>
                      </Button>
                      {artwork.length > 0 && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/builder/templates/${product.slug}`}>
                            <Box /> 3D artwork
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </AdminCard>
  )
}
