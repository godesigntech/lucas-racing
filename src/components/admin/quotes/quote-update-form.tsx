"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateQuoteRequest } from "@/lib/actions/admin/quotes"
import { quoteStatusMeta } from "@/lib/quotes/status"
import { quoteUpdateSchema, type QuoteUpdateValues } from "@/lib/validations/design-assistant"
import { quoteStatuses, type QuoteStatus } from "@/types/design-assistant"

interface QuoteUpdateFormProps {
  id: string
  status: QuoteStatus
  adminNotes: string
}

/** Move a quote request along and keep private notes on it. */
export function QuoteUpdateForm({ id, status, adminNotes }: QuoteUpdateFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<QuoteUpdateValues>({
    resolver: zodResolver(quoteUpdateSchema),
    defaultValues: { status, adminNotes },
  })

  async function onSubmit(values: QuoteUpdateValues) {
    const result = await runAction(() => updateQuoteRequest(id, values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <FormField id="quote-status" label="Status" hint={quoteStatusMeta[field.value].description}>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger {...fieldA11y("quote-status", undefined, true)} className="w-full">
                <SelectValue>{quoteStatusMeta[field.value].label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {quoteStatuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {quoteStatusMeta[value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />
      <FormField id="quote-admin-notes" label="Internal notes" optional error={errors.adminNotes?.message}>
        <Textarea
          {...register("adminNotes")}
          {...fieldA11y("quote-admin-notes", errors.adminNotes?.message)}
          rows={4}
          placeholder="Price quoted, follow-up date… Only admins see this."
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isSubmitting || !isDirty}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        Save changes
      </Button>
    </form>
  )
}
