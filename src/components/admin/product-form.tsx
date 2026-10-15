"use client"

import Link from "next/link"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ExternalLink, Loader2, Plus, Trash2 } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { HelmetArt } from "@/components/helmet/helmet-art"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { productCategories } from "@/data/categories"
import { updateProduct } from "@/lib/actions/admin/catalog"
import { formatPrice } from "@/lib/format"
import { productSchema, type ProductValues } from "@/lib/validations/admin"
import { filmPatterns, helmetFinishes, helmetLayouts, type HelmetLayout, type HelmetModel } from "@/types/helmet"
import { productBadges, type Product } from "@/types/product"

import { AdminCard } from "./admin-card"
import { MoneyInput } from "./money-input"

const layoutLabels: Record<HelmetLayout, string> = {
  apex: "Apex sweep",
  twin: "Twin stripes",
  split: "Split panels",
  shard: "Shards",
  halo: "Halo band",
  flow: "Flowing wave",
  blank: "Plain",
}

const colourFields = [
  { key: "base", label: "Base colour" },
  { key: "graphic", label: "Graphic colour" },
  { key: "accent", label: "Pinstripe colour" },
  { key: "trim", label: "Rubber trim" },
] as const

interface ProductFormProps {
  product: Product
  models: HelmetModel[]
}

export function ProductForm({ product, models }: ProductFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      category: product.category,
      models: product.models,
      priceOnRequest: product.startingPrice === null,
      basePrice: product.startingPrice ?? 0,
      badge: product.badge ?? "none",
      features: product.features.join("\n"),
      specs: product.specs,
      look: {
        layout: product.look.layout,
        finish: product.look.finish,
        base: product.look.base,
        graphic: product.look.graphic,
        accent: product.look.accent,
        trim: product.look.trim,
        film: product.look.film,
        spoiler: product.look.spoiler,
        number: product.look.number ?? "",
      },
      isActive: product.isActive,
      sortOrder: product.sortOrder,
    },
  })
  const specs = useFieldArray({ control, name: "specs" })
  const [name, priceOnRequest, basePrice, isActive, look] = useWatch({
    control,
    name: ["name", "priceOnRequest", "basePrice", "isActive", "look"],
  })

  async function onSubmit(values: ProductValues) {
    const result = await runAction(() => updateProduct(product.id, values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-6">
        <AdminCard title="Details">
          <div className="grid gap-5">
            <FormField id="product-name" label="Name" error={errors.name?.message}>
              <Input {...register("name")} {...fieldA11y("product-name", errors.name?.message)} />
            </FormField>
            <FormField id="product-tagline" label="Tagline" hint="One short line shown on product cards." error={errors.tagline?.message}>
              <Input {...register("tagline")} {...fieldA11y("product-tagline", errors.tagline?.message, true)} />
            </FormField>
            <FormField id="product-description" label="Description" error={errors.description?.message}>
              <Textarea {...register("description")} {...fieldA11y("product-description", errors.description?.message)} rows={4} />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <FormField id="product-category" label="Category">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="product-category" className="w-full">
                        <SelectValue>{productCategories.find((item) => item.id === field.value)?.label}</SelectValue>
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
              <Controller
                control={control}
                name="badge"
                render={({ field }) => (
                  <FormField id="product-badge" label="Badge">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="product-badge" className="w-full">
                        <SelectValue>{field.value === "none" ? "No badge" : field.value}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No badge</SelectItem>
                        {productBadges.map((badge) => (
                          <SelectItem key={badge} value={badge}>
                            {badge}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Pricing and availability">
          <div className="grid gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={control}
                name="basePrice"
                render={({ field }) => (
                  <FormField
                    id="product-price"
                    label="Starting price"
                    hint="Design and finishing. Options and a new helmet are added on top."
                    error={errors.basePrice?.message}
                  >
                    <MoneyInput
                      id="product-price"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={priceOnRequest}
                      aria-invalid={errors.basePrice ? true : undefined}
                      aria-describedby={errors.basePrice ? "product-price-error" : "product-price-hint"}
                    />
                  </FormField>
                )}
              />
              <Controller
                control={control}
                name="priceOnRequest"
                render={({ field }) => (
                  <div className="flex items-start gap-3 rounded-xl border border-carbon/10 p-4 sm:mt-7">
                    <Checkbox
                      id="product-on-request"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="product-on-request" className="block text-sm font-normal leading-snug">
                      <span className="font-semibold">Price on request</span>
                      <span className="block text-muted-foreground">Customers send an enquiry instead of checking out.</span>
                    </Label>
                  </div>
                )}
              />
            </div>

            <Controller
              control={control}
              name="models"
              render={({ field }) => (
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Available on</legend>
                  <div className="flex flex-wrap gap-3">
                    {models.map((model) => {
                      const checked = field.value.includes(model.id)
                      return (
                        <label key={model.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-carbon/15 px-4 py-3 text-sm has-checked:border-carbon">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) =>
                              field.onChange(next ? [...field.value, model.id] : field.value.filter((id) => id !== model.id))
                            }
                          />
                          {model.name}
                          {!model.isActive && <span className="text-xs text-muted-foreground">(hidden)</span>}
                        </label>
                      )
                    })}
                  </div>
                  {errors.models && <p className="text-xs font-medium text-destructive">{errors.models.message}</p>}
                </fieldset>
              )}
            />
          </div>
        </AdminCard>

        <AdminCard title="Showcase look" description="How the design appears on product cards and as the builder's starting point.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              control={control}
              name="look.layout"
              render={({ field }) => (
                <FormField id="look-layout" label="Graphic layout">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="look-layout" className="w-full">
                      <SelectValue>{layoutLabels[field.value]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {helmetLayouts.map((layout) => (
                        <SelectItem key={layout} value={layout}>
                          {layoutLabels[layout]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="look.finish"
              render={({ field }) => (
                <FormField id="look-finish" label="Finish">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="look-finish" className="w-full capitalize">
                      <SelectValue>{field.value}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {helmetFinishes.map((finish) => (
                        <SelectItem key={finish} value={finish} className="capitalize">
                          {finish}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
            {colourFields.map(({ key, label }) => (
              <FormField key={key} id={`look-${key}`} label={label} error={errors.look?.[key]?.message}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register(`look.${key}`)}
                    aria-label={`${label} picker`}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-card p-1"
                  />
                  <Input {...register(`look.${key}`)} {...fieldA11y(`look-${key}`, errors.look?.[key]?.message)} className="font-mono" />
                </div>
              </FormField>
            ))}
            <Controller
              control={control}
              name="look.film"
              render={({ field }) => (
                <FormField id="look-film" label="Illustrated pattern on the graphic">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="look-film" className="w-full capitalize">
                      <SelectValue>{field.value === "none" ? "Solid colour" : field.value}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filmPatterns.map((pattern) => (
                        <SelectItem key={pattern} value={pattern} className="capitalize">
                          {pattern === "none" ? "Solid colour" : pattern}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
            <FormField id="look-number" label="Sample race number" optional error={errors.look?.number?.message}>
              <Input {...register("look.number")} {...fieldA11y("look-number", errors.look?.number?.message)} maxLength={3} />
            </FormField>
            <Controller
              control={control}
              name="look.spoiler"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3 sm:col-span-2">
                  <Label htmlFor="look-spoiler" className="font-medium">
                    Show a rear spoiler
                  </Label>
                  <Switch id="look-spoiler" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </div>
        </AdminCard>

        <AdminCard title="Features and specification">
          <div className="grid gap-6">
            <FormField id="product-features" label="Key features" hint="One feature per line." error={errors.features?.message}>
              <Textarea {...register("features")} {...fieldA11y("product-features", errors.features?.message, true)} rows={4} />
            </FormField>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Specification rows</legend>
              {specs.fields.map((spec, index) => (
                <div key={spec.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-2">
                  <Input {...register(`specs.${index}.label`)} aria-label={`Spec ${index + 1} label`} placeholder="Label" />
                  <Input {...register(`specs.${index}.value`)} aria-label={`Spec ${index + 1} value`} placeholder="Value" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => specs.remove(index)} aria-label={`Remove spec ${index + 1}`}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => specs.append({ label: "", value: "" })}
                disabled={specs.fields.length >= 12}
              >
                <Plus /> Add row
              </Button>
            </fieldset>
          </div>
        </AdminCard>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <AdminCard>
          <div className="grid aspect-[4/3] place-items-center rounded-xl bg-smoke p-4">
            <HelmetArt look={{ ...look, number: look.number || undefined }} />
          </div>
          <p className="mt-4 font-display text-2xl font-bold uppercase">{name || "Untitled"}</p>
          <p className="text-sm text-muted-foreground">
            {formatPrice(priceOnRequest ? null : Number.isFinite(basePrice) ? basePrice : 0)}
          </p>
          <Link
            href={`/helmet-builder?template=${product.slug}`}
            target="_blank"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
          >
            View on website <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </AdminCard>

        <AdminCard>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="product-active" className="block">
                  <span className="font-semibold">Show on website</span>
                  <span className="block text-xs font-normal text-muted-foreground">{isActive ? "Live" : "Hidden"}</span>
                </Label>
                <Switch id="product-active" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
          <FormField id="product-sort" label="Sort order" hint="Lower numbers show first." className="mt-5">
            <Input
              {...register("sortOrder", { valueAsNumber: true })}
              {...fieldA11y("product-sort", errors.sortOrder?.message, true)}
              type="number"
              min={0}
            />
          </FormField>
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </AdminCard>
      </div>
    </form>
  )
}
