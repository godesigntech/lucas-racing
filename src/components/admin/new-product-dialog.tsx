"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { productCategories } from "@/data/categories"
import { createProduct } from "@/lib/actions/admin/catalog"
import { newProductSchema, type NewProductValues } from "@/lib/validations/admin"

/** Starts a new helmet design as a hidden draft, then opens it for editing. */
export function NewProductDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewProductValues>({
    resolver: zodResolver(newProductSchema),
    defaultValues: { name: "", category: productCategories[0].id },
  })

  async function onSubmit(values: NewProductValues) {
    const result = await runAction(() => createProduct(values), setError)
    if (result?.ok && result.data) {
      setOpen(false)
      router.push(`/admin/products/${result.data.slug}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New design
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New helmet design</DialogTitle>
          <DialogDescription>It starts hidden from the website. Add the details and price, then switch it live.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField id="new-product-name" label="Name" error={errors.name?.message}>
            <Input {...register("name")} {...fieldA11y("new-product-name", errors.name?.message)} placeholder="e.g. Night Run" autoFocus />
          </FormField>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <FormField id="new-product-category" label="Category">
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="new-product-category" className="w-full">
                    <SelectValue>{productCategories.find((category) => category.id === field.value)?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              Create design
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
