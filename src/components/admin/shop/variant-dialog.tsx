"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { MoneyInput } from "@/components/admin/money-input"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { saveShopVariant } from "@/lib/actions/admin/shop"
import { shopVariantSchema, type ShopVariantValues } from "@/lib/validations/shop"
import type { ShopVariant } from "@/types/shop"

interface VariantDialogProps {
  productId: string
  optionNames: string[]
  variant?: ShopVariant
  nextSortOrder?: number
  trigger: React.ReactNode
}

function toValues(variant: ShopVariant | undefined, optionNames: string[], nextSortOrder: number): ShopVariantValues {
  const options = Object.fromEntries(optionNames.map((name) => [name, variant?.options[name] ?? ""]))
  return variant
    ? {
        options,
        sku: variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        trackStock: variant.trackStock,
        allowBackorder: variant.allowBackorder,
        weightGrams: variant.weightGrams,
        isActive: variant.isActive,
        sortOrder: variant.sortOrder,
      }
    : { options, sku: "", price: 0, compareAtPrice: null, trackStock: true, allowBackorder: false, weightGrams: null, isActive: true, sortOrder: nextSortOrder }
}

/** Add or edit one option of a product: its size/colour, part number, price and stock rules. */
export function VariantDialog({ productId, optionNames, variant, nextSortOrder = 100, trigger }: VariantDialogProps) {
  const [open, setOpen] = useState(false)
  const [openingStock, setOpeningStock] = useState(0)
  const defaults = toValues(variant, optionNames, nextSortOrder)
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShopVariantValues>({ resolver: zodResolver(shopVariantSchema), defaultValues: defaults })

  async function onSubmit(values: ShopVariantValues) {
    const result = await runAction(() => saveShopVariant(productId, variant?.id ?? null, values, variant ? 0 : openingStock), setError)
    if (result?.ok) {
      setOpen(false)
      if (!variant) {
        reset(defaults)
        setOpeningStock(0)
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset(defaults)
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{variant ? "Edit option" : "Add an option"}</DialogTitle>
          <DialogDescription>
            {optionNames.length ? `Set its ${optionNames.join(" and ").toLowerCase()}, price and stock rules.` : "Its price, part number and stock rules."}
          </DialogDescription>
        </DialogHeader>
        <form id="variant-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
          {optionNames.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {optionNames.map((name) => (
                <FormField key={name} id={`variant-option-${name}`} label={name}>
                  <Input {...register(`options.${name}`)} id={`variant-option-${name}`} placeholder={name === "Size" ? "e.g. M" : ""} />
                </FormField>
              ))}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="variant-sku" label="Part number (SKU)" optional error={errors.sku?.message}>
              <Input {...register("sku")} {...fieldA11y("variant-sku", errors.sku?.message)} className="font-mono" />
            </FormField>
            <FormField id="variant-weight" label="Weight (grams)" optional error={errors.weightGrams?.message}>
              <Input
                {...register("weightGrams", { setValueAs: (value) => (value === "" || value === null ? null : Number(value)) })}
                {...fieldA11y("variant-weight", errors.weightGrams?.message)}
                type="number"
                min={0}
              />
            </FormField>
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <FormField id="variant-price" label="Price" error={errors.price?.message}>
                  <MoneyInput id="variant-price" value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={errors.price ? true : undefined} />
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="compareAtPrice"
              render={({ field }) => (
                <FormField id="variant-compare" label="Was price" optional hint="Shown crossed out, for offers." error={errors.compareAtPrice?.message}>
                  <MoneyInput
                    id="variant-compare"
                    value={field.value ?? Number.NaN}
                    onChange={(value) => field.onChange(Number.isNaN(value) ? null : value)}
                    onBlur={field.onBlur}
                  />
                </FormField>
              )}
            />
          </div>

          {!variant && (
            <FormField id="variant-opening-stock" label="Opening stock" hint="How many you have now. Logged as the starting count.">
              <Input
                id="variant-opening-stock"
                type="number"
                value={openingStock}
                onChange={(event) => setOpeningStock(Math.trunc(Number(event.target.value) || 0))}
                className="max-w-32"
              />
            </FormField>
          )}

          <div className="grid gap-3">
            {(
              [
                ["trackStock", "Track stock", "Count it down as it sells. Turn off for made-to-order items."],
                ["allowBackorder", "Sell when out of stock", "Customers can still order; you supply it when it arrives."],
                ["isActive", "Available", "Turn off to hide this option."],
              ] as const
            ).map(([name, title, hint]) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-carbon/10 p-4">
                    <Label htmlFor={`variant-${name}`} className="block">
                      <span className="font-semibold">{title}</span>
                      <span className="block text-xs font-normal text-muted-foreground">{hint}</span>
                    </Label>
                    <Switch id={`variant-${name}`} checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            ))}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="variant-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {variant ? "Save option" : "Add option"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
