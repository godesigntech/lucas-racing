import Link from "next/link"
import { ChevronRight, Package } from "lucide-react"

import { StockBadge } from "@/components/shop/stock-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney } from "@/lib/format"
import { stockStatus } from "@/lib/shop/stock"
import { cn } from "@/lib/utils"
import type { ShopProduct, StockStatus } from "@/types/shop"

import { storeLabels } from "./store-labels"

function priceRange(product: ShopProduct): string {
  const prices = product.variants.map((variant) => variant.price)
  if (prices.length === 0) return "No price"
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  return low === high ? formatMoney(low) : `${formatMoney(low)} – ${formatMoney(high)}`
}

/** The worst stock status across a product's active variants, for a quick overview. */
function overallStock(product: ShopProduct): { status: StockStatus; total: number | null } {
  const active = product.variants.filter((variant) => variant.isActive)
  const tracked = active.filter((variant) => variant.trackStock)
  const order: StockStatus[] = ["out_of_stock", "low_stock", "backorder", "in_stock", "untracked"]
  const statuses = active.map(stockStatus)
  const status = order.find((candidate) => statuses.includes(candidate)) ?? "untracked"
  return { status, total: tracked.length ? tracked.reduce((sum, variant) => sum + variant.stockQuantity, 0) : null }
}

function Thumb({ product }: { product: ShopProduct }) {
  return (
    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-carbon/5">
      {product.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
        <img src={product.images[0]} alt="" className="size-full object-cover" />
      ) : (
        <Package className="size-5 text-muted-foreground" aria-hidden />
      )}
    </span>
  )
}

export function ShopProductsTable({ products, emptyMessage }: { products: ShopProduct[]; emptyMessage: string }) {
  if (products.length === 0) {
    return <p className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <>
      <ul className="divide-y divide-carbon/10 md:hidden">
        {products.map((product) => {
          const stock = overallStock(product)
          return (
            <li key={product.id}>
              <Link href={`/admin/shop/${product.id}`} className={cn("flex items-center gap-3 px-5 py-4 hover:bg-foreground/[0.03]", !product.isActive && "opacity-60")}>
                <Thumb product={product} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-semibold">{product.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {storeLabels[product.storeId]} · {priceRange(product)}
                    {!product.isActive && " · Hidden"}
                  </p>
                  <StockBadge status={stock.status} />
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>

      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Product</TableHead>
            <TableHead>Shop</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Options</TableHead>
            <TableHead className="text-right">In stock</TableHead>
            <TableHead className="pr-5">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const stock = overallStock(product)
            return (
              <TableRow key={product.id} className={cn("group relative", !product.isActive && "opacity-60")}>
                <TableCell className="pl-5">
                  <div className="flex items-center gap-3">
                    <Thumb product={product} />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/shop/${product.id}`}
                        className="font-semibold after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline"
                      >
                        {product.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.variants[0]?.sku || product.slug}
                        {!product.isActive && " · Hidden"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {storeLabels[product.storeId]}
                  {product.storeId === "delta" && <span className="block text-xs text-muted-foreground">{product.externalClicks} clicks to Delta</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{priceRange(product)}</TableCell>
                <TableCell className="text-right tabular-nums">{product.variants.length}</TableCell>
                <TableCell className="text-right tabular-nums">{stock.total ?? "—"}</TableCell>
                <TableCell className="pr-5">
                  <StockBadge status={stock.status} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}
