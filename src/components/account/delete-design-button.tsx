"use client"

import { Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteDesign } from "@/lib/actions/designs"

export function DeleteDesignButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDialog
      title="Delete this design?"
      description={`"${name}" will be removed from your account. Orders you've already placed aren't affected.`}
      confirmLabel="Delete design"
      trigger={
        <Button variant="ghost" size="sm">
          <Trash2 /> Delete
        </Button>
      }
      onConfirm={async () => {
        const result = await deleteDesign(id)
        if (result.ok) toast.success(result.message)
        else toast.error(result.message)
        return result.ok
      }}
    />
  )
}
