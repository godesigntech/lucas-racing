"use client"

import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteShopProduct } from "@/lib/actions/admin/shop"

export function DeleteShopProductButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  return (
    <ConfirmDialog
      title={`Delete ${title}?`}
      description="This removes the product, its options and photos list. Products that have been ordered can't be deleted; switch them off instead."
      confirmLabel="Delete product"
      trigger={
        <Button variant="destructive">
          <Trash2 /> Delete
        </Button>
      }
      onConfirm={async () => {
        const result = await deleteShopProduct(id)
        if (!result.ok) {
          toast.error(result.message)
          return false
        }
        toast.success(result.message)
        router.push("/admin/shop")
        return true
      }}
    />
  )
}
