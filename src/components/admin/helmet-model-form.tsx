"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateHelmetModel } from "@/lib/actions/admin/catalog"
import { cn } from "@/lib/utils"
import { helmetModelSchema, type HelmetModelValues } from "@/lib/validations/admin"
import type { HelmetModel } from "@/types/helmet"

import { AdminCard } from "./admin-card"
import { MoneyInput } from "./money-input"

const ALL_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL"]

export function HelmetModelForm({ model }: { model: HelmetModel }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HelmetModelValues>({
    resolver: zodResolver(helmetModelSchema),
    defaultValues: {
      name: model.name,
      summary: model.summary,
      newHelmetPrice: model.newHelmetPrice,
      sizes: model.sizes,
      isActive: model.isActive,
    },
  })
  const id = (field: string) => `${model.id}-${field}`

  async function onSubmit(values: HelmetModelValues) {
    const result = await runAction(() => updateHelmetModel(model.id, values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <AdminCard
        title={model.name}
        description={model.brand}
        action={
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Label htmlFor={id("active")} className="text-xs text-muted-foreground">
                  {field.value ? "Offered" : "Hidden"}
                </Label>
                <Switch id={id("active")} checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        }
      >
        <div className="grid gap-5">
          <FormField id={id("name")} label="Display name" error={errors.name?.message}>
            <Input {...register("name")} {...fieldA11y(id("name"), errors.name?.message)} />
          </FormField>
          <Controller
            control={control}
            name="newHelmetPrice"
            render={({ field }) => (
              <FormField
                id={id("price")}
                label="New helmet price"
                hint="Added when a customer chooses “Supply a new helmet”."
                error={errors.newHelmetPrice?.message}
              >
                <MoneyInput
                  id={id("price")}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={errors.newHelmetPrice ? true : undefined}
                />
              </FormField>
            )}
          />
          <Controller
            control={control}
            name="sizes"
            render={({ field }) => (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Sizes offered</legend>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => {
                    const checked = field.value.includes(size)
                    return (
                      <label key={size} className="cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={checked}
                          onChange={() =>
                            field.onChange(
                              checked
                                ? field.value.filter((value) => value !== size)
                                : ALL_SIZES.filter((value) => value === size || field.value.includes(value)),
                            )
                          }
                        />
                        <span
                          className={cn(
                            "grid h-9 min-w-11 place-items-center rounded-lg border px-2.5 text-sm font-medium transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                            checked ? "border-carbon bg-carbon text-paper" : "border-carbon/15 text-muted-foreground hover:border-carbon/40",
                          )}
                        >
                          {size}
                        </span>
                      </label>
                    )
                  })}
                </div>
                {errors.sizes && <p className="text-xs font-medium text-destructive">{errors.sizes.message}</p>}
              </fieldset>
            )}
          />
          <FormField id={id("summary")} label="Short description" error={errors.summary?.message}>
            <Input {...register("summary")} {...fieldA11y(id("summary"), errors.summary?.message)} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              Save {model.shortName}
            </Button>
          </div>
        </div>
      </AdminCard>
    </form>
  )
}
