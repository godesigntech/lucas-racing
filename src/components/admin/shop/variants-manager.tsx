"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { StockBadge } from "@/components/shop/stock-badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteShopVariant } from "@/lib/actions/admin/shop"
import { formatMoney } from "@/lib/format"
import { stockStatus, variantLabel } from "@/lib/shop/stock"
import { cn } from "@/lib/utils"
import type { ShopProduct } from "@/types/shop"

import { StockCountDialog } from "./stock-count-dialog"
import { VariantDialog } from "./variant-dialog"

/** The product's options (sizes, colours, part numbers) with price and stock, each editable. */
export function VariantsManager({ product }: { product: ShopProduct }) {
  const nextSortOrder = product.variants.reduce((highest, variant) => Math.max(highest, variant.sortOrder), 0) + 10

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Option</TableHead>
              <TableHead>Part number</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.variants.map((variant) => {
              const label = variantLabel(variant) || "Standard"
              return (
                <TableRow key={variant.id} className={cn(!variant.isActive && "opacity-55")}>
                  <TableCell className="font-medium">
                    {label}
                    {!variant.isActive && <span className="ml-2 text-xs text-muted-foreground">Hidden</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{variant.sku || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(variant.price)}
                    {variant.compareAtPrice !== null && (
                      <span className="ml-1.5 text-xs text-muted-foreground line-through">{formatMoney(variant.compareAtPrice)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {variant.trackStock ? (
                      <StockCountDialog
                        productId={product.id}
                        variantId={variant.id}
                        label={label}
                        current={variant.stockQuantity}
                        trigger={
                          <Button variant="outline" size="sm" className="tabular-nums" aria-label={`Update stock for ${label}: ${variant.stockQuantity}`}>
                            {variant.stockQuantity}
                          </Button>
                        }
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Not tracked</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StockBadge status={stockStatus(variant)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <VariantDialog
                        productId={product.id}
                        optionNames={product.optionNames}
                        variant={variant}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${label}`}>
                            <Pencil />
                          </Button>
                        }
                      />
                      <ConfirmDialog
                        title={`Delete ${label}?`}
                        description="Options that have been ordered can't be deleted; switch them off instead."
                        confirmLabel="Delete option"
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${label}`} disabled={product.variants.length <= 1}>
                            <Trash2 />
                          </Button>
                        }
                        onConfirm={async () => {
                          const result = await deleteShopVariant(product.id, variant.id)
                          if (result.ok) toast.success(result.message)
                          else toast.error(result.message)
                          return result.ok
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <VariantDialog
        productId={product.id}
        optionNames={product.optionNames}
        nextSortOrder={nextSortOrder}
        trigger={
          <Button variant="outline" size="sm">
            <Plus /> Add an option
          </Button>
        }
      />
      {product.optionNames.length === 0 && product.variants.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Tip: set option names (e.g. Size) in the details so customers can tell these options apart.
        </p>
      )}
    </div>
  )
}
