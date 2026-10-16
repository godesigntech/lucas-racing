"use client"

import { Pencil, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteNewsCategory } from "@/lib/actions/admin/news"
import type { NewsCategory } from "@/types/news"

import { NewsCategoryDialog } from "./news-category-dialog"

export function NewsCategoryRowActions({ category }: { category: NewsCategory }) {
  return (
    <div className="flex justify-end gap-1.5">
      <NewsCategoryDialog
        category={category}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
      />
      <ConfirmDialog
        title={`Delete ${category.name}?`}
        description="Its posts stay published without a category, and the category page goes."
        confirmLabel="Delete category"
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${category.name}`}>
            <Trash2 />
          </Button>
        }
        onConfirm={async () => {
          const result = await deleteNewsCategory(category.id)
          if (result.ok) toast.success(result.message)
          else toast.error(result.message)
          return result.ok
        }}
      />
    </div>
  )
}
