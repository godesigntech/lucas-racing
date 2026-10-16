"use client"

import { Pencil, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteShopCategory } from "@/lib/actions/admin/shop"
import type { ShopCategory } from "@/types/shop"

import { CategoryDialog } from "./category-dialog"

export function CategoryRowActions({ category }: { category: ShopCategory }) {
  return (
    <div className="flex justify-end gap-1.5">
      <CategoryDialog
        category={category}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
      />
      <ConfirmDialog
        title={`Delete ${category.name}?`}
        description="Its products stay in the shop without a category."
        confirmLabel="Delete category"
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${category.name}`}>
            <Trash2 />
          </Button>
        }
        onConfirm={async () => {
          const result = await deleteShopCategory(category.id)
          if (result.ok) toast.success(result.message)
          else toast.error(result.message)
          return result.ok
        }}
      />
    </div>
  )
}
