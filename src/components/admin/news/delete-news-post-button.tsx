"use client"

import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteNewsPost } from "@/lib/actions/admin/news"

export function DeleteNewsPostButton({ id, title, compact }: { id: string; title: string; compact?: boolean }) {
  const router = useRouter()
  return (
    <ConfirmDialog
      title={`Delete "${title}"?`}
      description="The post is removed from the website for good. To take it down for now, switch it back to a draft instead."
      confirmLabel="Delete post"
      trigger={
        compact ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${title}`}>
            <Trash2 />
          </Button>
        ) : (
          <Button variant="destructive">
            <Trash2 /> Delete
          </Button>
        )
      }
      onConfirm={async () => {
        const result = await deleteNewsPost(id)
        if (!result.ok) {
          toast.error(result.message)
          return false
        }
        toast.success(result.message)
        if (!compact) router.push("/admin/news")
        return true
      }}
    />
  )
}
