"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateAdminNotes } from "@/lib/actions/admin/orders"
import { adminNotesSchema, type AdminNotesValues } from "@/lib/validations/admin"

/** Private notes about an order; never shown to the customer. */
export function AdminNotesForm({ orderId, adminNotes }: { orderId: string; adminNotes: string }) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminNotesValues>({ resolver: zodResolver(adminNotesSchema), defaultValues: { adminNotes } })

  async function onSubmit(values: AdminNotesValues) {
    const result = await runAction(() => updateAdminNotes(orderId, values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <label htmlFor="admin-notes" className="sr-only">
        Internal notes
      </label>
      <Textarea
        id="admin-notes"
        {...register("adminNotes")}
        aria-invalid={errors.adminNotes ? true : undefined}
        rows={4}
        placeholder="Only admins can see these notes."
      />
      {errors.adminNotes && <p className="text-xs font-medium text-destructive">{errors.adminNotes.message}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Save notes
        </Button>
      </div>
    </form>
  )
}
