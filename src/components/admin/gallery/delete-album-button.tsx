"use client"

import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteAlbum } from "@/lib/actions/admin/gallery"

export function DeleteAlbumButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  return (
    <ConfirmDialog
      title={`Delete "${title}"?`}
      description="The album and all its photos are removed from the website. To take it down for now, switch it off instead."
      confirmLabel="Delete album"
      trigger={
        <Button variant="destructive">
          <Trash2 /> Delete
        </Button>
      }
      onConfirm={async () => {
        const result = await deleteAlbum(id)
        if (!result.ok) {
          toast.error(result.message)
          return false
        }
        toast.success(result.message)
        router.push("/admin/gallery")
        return true
      }}
    />
  )
}
