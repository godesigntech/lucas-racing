"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createShopProduct } from "@/lib/actions/admin/shop"
import { newShopProductSchema, type NewShopProductValues } from "@/lib/validations/shop"
import type { StoreId } from "@/types/shop"

import { slugify, storeLabels, storeOptions } from "./store-labels"

/** Starts a product with a name, shop and price, then opens it to fill in the rest. */
export function NewShopProductDialog({ defaultStore = "ms-kart", stores }: { defaultStore?: StoreId; stores?: StoreId[] }) {
  const options = stores ? storeOptions.filter((option) => stores.includes(option.value)) : storeOptions
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const defaults: NewShopProductValues = { storeId: defaultStore, title: "", slug: "", price: 0 }
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<NewShopProductValues>({ resolver: zodResolver(newShopProductSchema), defaultValues: defaults })

  async function onSubmit(values: NewShopProductValues) {
    const result = await runAction(() => createShopProduct(values), setError)
    if (result?.ok && result.data) {
      setOpen(false)
      reset(defaults)
      router.push(`/admin/shop/${result.data.id}`)
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
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add a product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a product</DialogTitle>
          <DialogDescription>It starts hidden. Add photos, options and stock, then switch it on.</DialogDescription>
        </DialogHeader>
        <form id="new-shop-product" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
          <Controller
            control={control}
            name="storeId"
            render={({ field }) => (
              <FormField id="new-product-store" label="Shop" error={errors.storeId?.message}>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="new-product-store" className="w-full">
                    <SelectValue>{storeLabels[field.value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          />
          <FormField id="new-product-title" label="Product name" error={errors.title?.message}>
            <Input
              {...register("title", {
                onChange: (event) => {
                  if (!dirtyFields.slug) setValue("slug", slugify(event.target.value))
                },
              })}
              {...fieldA11y("new-product-title", errors.title?.message)}
              placeholder="e.g. MS Kart front bumper"
            />
          </FormField>
          <FormField id="new-product-slug" label="Web address" hint="lucasracing.co.uk/shop/p/…" error={errors.slug?.message}>
            <Input {...register("slug")} {...fieldA11y("new-product-slug", errors.slug?.message, true)} />
          </FormField>
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <FormField id="new-product-price" label="Price" hint="You can add sizes or colours with their own prices next." error={errors.price?.message}>
                <MoneyInput
                  id="new-product-price"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={errors.price ? true : undefined}
                />
              </FormField>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="new-shop-product" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Create product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
