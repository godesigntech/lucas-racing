"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { setVariantStock } from "@/lib/actions/admin/shop"
import { stockCountSchema, type StockCountValues } from "@/lib/validations/shop"

interface StockCountDialogProps {
  productId: string
  variantId: string
  label: string
  current: number
  trigger: React.ReactNode
}

/** Set the counted stock level for one option. The difference is logged with the note. */
export function StockCountDialog({ productId, variantId, label, current, trigger }: StockCountDialogProps) {
  const [open, setOpen] = useState(false)
  const defaults: StockCountValues = { quantity: current, note: "" }
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockCountValues>({ resolver: zodResolver(stockCountSchema), defaultValues: defaults })

  async function onSubmit(values: StockCountValues) {
    const result = await runAction(() => setVariantStock(productId, variantId, values), setError)
    if (result?.ok) setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) reset(defaults)
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update stock</DialogTitle>
          <DialogDescription>{label}. Currently {current} in stock.</DialogDescription>
        </DialogHeader>
        <form id="stock-count-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
          <FormField id="stock-quantity" label="Stock now" error={errors.quantity?.message}>
            <Input
              {...register("quantity", { valueAsNumber: true })}
              {...fieldA11y("stock-quantity", errors.quantity?.message)}
              type="number"
              className="max-w-32 tabular-nums"
              autoFocus
            />
          </FormField>
          <FormField id="stock-note" label="Reason" optional hint="e.g. Delivery from MS Kart, stock count, damaged." error={errors.note?.message}>
            <Input {...register("note")} {...fieldA11y("stock-note", errors.note?.message, true)} />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="stock-count-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Save stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
