import { Suspense } from "react"
import Link from "next/link"
import { Pencil } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ProductActiveSwitch } from "@/components/admin/product-active-switch"
import { HelmetArt } from "@/components/helmet/helmet-art"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCategory } from "@/lib/catalog/categories"
import { listAdminProducts } from "@/lib/data/admin"
import { formatMoney } from "@/lib/format"

export const metadata = { title: "Products" }

export default function AdminProductsPage() {
  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Helmet designs shown on the website. Set prices, descriptions and which helmets each design is available on."
      />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        <ProductList />
      </Suspense>
    </>
  )
}

async function ProductList() {
  const products = await listAdminProducts()

  return (
    <AdminCard flush>
      <div className="overflow-x-auto">
        <Table className="min-w-[44rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Design</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Starting price</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Live</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
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
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{getCategory(product.category).label}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {product.startingPrice === null ? (
                    <span className="font-normal text-muted-foreground">On request</span>
                  ) : (
                    formatMoney(product.startingPrice)
                  )}
                </TableCell>
                <TableCell>
                  {product.badge ? <Badge variant="secondary">{product.badge}</Badge> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <ProductActiveSwitch productId={product.id} name={product.name} isActive={product.isActive} />
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/products/${product.slug}`}>
                      <Pencil /> Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminCard>
  )
}
