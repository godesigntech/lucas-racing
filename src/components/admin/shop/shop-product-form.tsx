"use client"

import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, X } from "lucide-react"

import { MoneyInput } from "@/components/admin/money-input"
import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { updateShopProduct } from "@/lib/actions/admin/shop"
import { shopProductSchema, type ShopProductValues } from "@/lib/validations/shop"
import { finishLabels } from "@/lib/shop/part-finish"
import { finishTypes, type ShopCategory, type ShopProduct, type StoreId } from "@/types/shop"

import { storeLabels, storeOptions } from "./store-labels"

const NO_CATEGORY = "none"

interface ShopProductFormProps {
  product: ShopProduct
  categories: ShopCategory[]
  /** Shops the user may move the product to (Teamwear staff: Teamwear only). */
  stores?: StoreId[]
}

function SwitchRow({ id, title, hint, checked, onChange }: { id: string; title: string; hint: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-carbon/10 p-4">
      <Label htmlFor={id} className="block">
        <span className="font-semibold">{title}</span>
        <span className="block text-xs font-normal text-muted-foreground">{hint}</span>
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/** Name, shop, category, description, specifications and visibility. */
export function ShopProductForm({ product, categories, stores }: ShopProductFormProps) {
  const storeChoices = stores ? storeOptions.filter((option) => stores.includes(option.value)) : storeOptions
  const defaults: ShopProductValues = {
    storeId: product.storeId,
    categoryId: product.categoryId,
    title: product.title,
    slug: product.slug,
    brand: product.brand,
    description: product.description,
    specs: product.specs,
    optionNames: product.optionNames,
    externalUrl: product.externalUrl ?? "",
    isActive: product.isActive,
    featured: product.featured,
    customisable: product.customisable,
    customFinishes: product.customFinishes,
    customFee: product.customFee,
    sizeGuide: product.sizeGuide,
    sortOrder: product.sortOrder,
  }
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ShopProductValues>({ resolver: zodResolver(shopProductSchema), defaultValues: defaults })
  const specs = useFieldArray({ control, name: "specs" })
  const [storeId, optionNames, customisable] = useWatch({ control, name: ["storeId", "optionNames", "customisable"] })
  const storeCategories = categories.filter((category) => category.storeId === storeId)

  async function onSubmit(values: ShopProductValues) {
    const result = await runAction(() => updateShopProduct(product.id, values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="product-title" label="Product name" error={errors.title?.message} className="sm:col-span-2">
          <Input {...register("title")} {...fieldA11y("product-title", errors.title?.message)} />
        </FormField>
        <Controller
          control={control}
          name="storeId"
          render={({ field }) => (
            <FormField id="product-store" label="Shop" error={errors.storeId?.message}>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  setValue("categoryId", null, { shouldDirty: true })
                }}
              >
                <SelectTrigger id="product-store" className="w-full">
                  <SelectValue>{storeLabels[field.value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {storeChoices.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <FormField id="product-category" label="Category" optional>
              <Select value={field.value ?? NO_CATEGORY} onValueChange={(value) => field.onChange(value === NO_CATEGORY ? null : value)}>
                <SelectTrigger id="product-category" className="w-full">
                  <SelectValue>{storeCategories.find((category) => category.id === field.value)?.name ?? "No category"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {storeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <FormField id="product-slug" label="Web address" hint="lucasracing.co.uk/shop/p/…" error={errors.slug?.message}>
          <Input {...register("slug")} {...fieldA11y("product-slug", errors.slug?.message, true)} />
        </FormField>
        <FormField id="product-brand" label="Brand" optional error={errors.brand?.message}>
          <Input {...register("brand")} {...fieldA11y("product-brand", errors.brand?.message)} placeholder="e.g. MS Kart" />
        </FormField>
      </div>

      <FormField id="product-description" label="Description" optional error={errors.description?.message}>
        <Textarea {...register("description")} {...fieldA11y("product-description", errors.description?.message)} rows={6} />
      </FormField>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Specifications</legend>
        {specs.fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-2">
            <Input {...register(`specs.${index}.label`)} aria-label={`Specification ${index + 1} label`} placeholder="e.g. Material" />
            <Input {...register(`specs.${index}.value`)} aria-label={`Specification ${index + 1} value`} placeholder="e.g. Chromoly steel" />
            <Button type="button" variant="ghost" size="icon" onClick={() => specs.remove(index)} aria-label={`Remove specification ${index + 1}`}>
              <X />
            </Button>
          </div>
        ))}
        {errors.specs && <p className="text-xs font-medium text-destructive">Fill in or remove the empty specifications.</p>}
        <Button type="button" variant="outline" size="sm" onClick={() => specs.append({ label: "", value: "" })} disabled={specs.fields.length >= 30}>
          <Plus /> Add a specification
        </Button>
      </fieldset>

      <FormField
        id="product-options"
        label="Option names"
        optional
        hint="What its options differ by, separated by commas, e.g. Size, Colour. Leave empty for a single item."
        error={errors.optionNames?.message}
      >
        <Input
          id="product-options"
          defaultValue={defaults.optionNames.join(", ")}
          onChange={(event) =>
            setValue(
              "optionNames",
              event.target.value
                .split(",")
                .map((name) => name.trim())
                .filter(Boolean),
              { shouldDirty: true },
            )
          }
          aria-describedby="product-options-hint"
        />
      </FormField>
      {optionNames.length > 0 && (
        <p className="-mt-3 text-xs text-muted-foreground">Each option below sets: {optionNames.join(", ")}.</p>
      )}

      {storeId === "delta" && (
        <FormField id="product-external" label="Link to Delta Racewear" hint="Where customers customise and order this suit." error={errors.externalUrl?.message}>
          <Input {...register("externalUrl")} {...fieldA11y("product-external", errors.externalUrl?.message, true)} placeholder="https://" />
        </FormField>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <SwitchRow id="product-active" title="On sale" hint="Shown in the shop." checked={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="featured"
          render={({ field }) => (
            <SwitchRow id="product-featured" title="Featured" hint="Highlighted first." checked={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="customisable"
          render={({ field }) => (
            <SwitchRow id="product-customisable" title="Customisable" hint="Offered with a custom finish." checked={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      {customisable && (
        <fieldset className="space-y-4 rounded-xl border border-carbon/10 p-4">
          <legend className="px-1 font-semibold">Custom finish</legend>
          <p className="text-sm text-muted-foreground">
            Customers pick one of these finishes. Colours, films, chrome and lacquers are priced from the helmet price list; the
            fee below is added for the work on this part.
            {storeId !== "hydrokarts-parts" && " Customisable parts are sold under Customisation in the HydroKarts parts shop."}
          </p>
          <Controller
            control={control}
            name="customFinishes"
            render={({ field }) => (
              <div className="flex flex-wrap gap-4">
                {finishTypes.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={field.value.includes(type)}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? finishTypes.filter((item) => item === type || field.value.includes(item)) : field.value.filter((item) => item !== type))
                      }
                    />
                    {finishLabels[type]}
                  </label>
                ))}
              </div>
            )}
          />
          {errors.customFinishes?.message && <p className="text-sm text-destructive">{errors.customFinishes.message}</p>}
          <Controller
            control={control}
            name="customFee"
            render={({ field }) => (
              <FormField id="product-custom-fee" label="Customisation fee" hint="Added to the part price for any finish." error={errors.customFee?.message}>
                <MoneyInput id="product-custom-fee" value={field.value} onChange={field.onChange} className="max-w-40" />
              </FormField>
            )}
          />
        </fieldset>
      )}

      <FormField
        id="product-size-guide"
        label="Size guide"
        optional
        hint="Shown on the product page. A table works well: | Size | Chest | Length | on the first line, then | --- | --- | --- |, then one line per size."
        error={errors.sizeGuide?.message}
      >
        <Textarea {...register("sizeGuide")} {...fieldA11y("product-size-guide", errors.sizeGuide?.message, true)} rows={5} className="min-h-28 font-mono text-sm" />
      </FormField>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <FormField id="product-sort" label="Order" hint="Lower numbers come first." error={errors.sortOrder?.message}>
          <Input
            {...register("sortOrder", { valueAsNumber: true })}
            {...fieldA11y("product-sort", errors.sortOrder?.message, true)}
            type="number"
            min={0}
            className="max-w-32"
          />
        </FormField>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Save details
        </Button>
      </div>
    </form>
  )
}
