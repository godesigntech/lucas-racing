"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { saveShopCategory } from "@/lib/actions/admin/shop"
import { shopCategorySchema, type ShopCategoryValues } from "@/lib/validations/shop"
import type { ShopCategory, StoreId } from "@/types/shop"

import { slugify, storeLabels, storeOptions } from "./store-labels"

interface CategoryDialogProps {
  category?: ShopCategory
  defaultStore?: StoreId
  /** Shops the user may choose (Teamwear staff: Teamwear only). */
  stores?: StoreId[]
  trigger: React.ReactNode
}

export function CategoryDialog({ category, defaultStore = "ms-kart", stores, trigger }: CategoryDialogProps) {
  const options = stores ? storeOptions.filter((option) => stores.includes(option.value)) : storeOptions
  const [open, setOpen] = useState(false)
  const defaults: ShopCategoryValues = category
    ? {
        storeId: category.storeId,
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      }
    : { storeId: defaultStore, name: "", slug: "", description: "", isActive: true, sortOrder: 100 }
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ShopCategoryValues>({ resolver: zodResolver(shopCategorySchema), defaultValues: defaults })

  async function onSubmit(values: ShopCategoryValues) {
    const result = await runAction(() => saveShopCategory(category?.id ?? null, values), setError)
    if (result?.ok) {
      setOpen(false)
      if (!category) reset(defaults)
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? `Edit ${category.name}` : "Add a category"}</DialogTitle>
          <DialogDescription>Categories group products within a shop.</DialogDescription>
        </DialogHeader>
        <form id="category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
          <Controller
            control={control}
            name="storeId"
            render={({ field }) => (
              <FormField id="category-store" label="Shop">
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category-store" className="w-full">
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
          <FormField id="category-name" label="Name" error={errors.name?.message}>
            <Input
              {...register("name", {
                onChange: (event) => {
                  if (!category && !dirtyFields.slug) setValue("slug", slugify(event.target.value))
                },
              })}
              {...fieldA11y("category-name", errors.name?.message)}
            />
          </FormField>
          <FormField id="category-slug" label="Web address" hint="Used in the shop's links." error={errors.slug?.message}>
            <Input {...register("slug")} {...fieldA11y("category-slug", errors.slug?.message, true)} />
          </FormField>
          <FormField id="category-description" label="Description" optional error={errors.description?.message}>
            <Textarea {...register("description")} {...fieldA11y("category-description", errors.description?.message)} rows={3} className="min-h-20" />
          </FormField>
          <div className="flex items-end justify-between gap-4">
            <FormField id="category-sort" label="Order" error={errors.sortOrder?.message}>
              <Input {...register("sortOrder", { valueAsNumber: true })} id="category-sort" type="number" min={0} className="max-w-28" />
            </FormField>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center gap-3 pb-2">
                  <Label htmlFor="category-active">Visible</Label>
                  <Switch id="category-active" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {category ? "Save category" : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
