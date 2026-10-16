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
import { Textarea } from "@/components/ui/textarea"
import { saveNewsCategory } from "@/lib/actions/admin/news"
import { slugify } from "@/lib/news/text"
import { newsCategorySchema, type NewsCategoryValues } from "@/lib/validations/news"
import type { NewsCategory } from "@/types/news"

export function NewsCategoryDialog({ category, trigger }: { category?: NewsCategory; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const defaults: NewsCategoryValues = category
    ? { name: category.name, slug: category.slug, description: category.description, sortOrder: category.sortOrder }
    : { name: "", slug: "", description: "", sortOrder: 100 }
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<NewsCategoryValues>({ resolver: zodResolver(newsCategorySchema), defaultValues: defaults })

  async function onSubmit(values: NewsCategoryValues) {
    const result = await runAction(() => saveNewsCategory(category?.id ?? null, values), setError)
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
          <DialogDescription>Categories group posts and each gets its own page on the website.</DialogDescription>
        </DialogHeader>
        <form id="news-category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
          <FormField id="news-category-name" label="Name" error={errors.name?.message}>
            <Input
              {...register("name", {
                onChange: (event) => {
                  if (!category && !dirtyFields.slug) setValue("slug", slugify(event.target.value))
                },
              })}
              {...fieldA11y("news-category-name", errors.name?.message)}
            />
          </FormField>
          <FormField id="news-category-slug" label="Web address" hint="news/category/…" error={errors.slug?.message}>
            <Input {...register("slug")} {...fieldA11y("news-category-slug", errors.slug?.message, true)} />
          </FormField>
          <FormField id="news-category-description" label="Description" optional hint="Shown on the category page and to search engines." error={errors.description?.message}>
            <Textarea {...register("description")} {...fieldA11y("news-category-description", errors.description?.message, true)} rows={3} className="min-h-20" />
          </FormField>
          <FormField id="news-category-sort" label="Order" hint="Lower numbers come first." error={errors.sortOrder?.message}>
            <Input {...register("sortOrder", { valueAsNumber: true })} id="news-category-sort" type="number" min={0} className="max-w-28" />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="news-category-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {category ? "Save category" : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
