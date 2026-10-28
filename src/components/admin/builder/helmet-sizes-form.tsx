"use client"

import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { OptionPriceInput } from "@/components/admin/money-input"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { saveHelmetSizes } from "@/lib/actions/admin/builder-catalog"
import { helmetSizesSchema, type HelmetSizesValues } from "@/lib/validations/builder-admin"
import type { HelmetModel } from "@/types/helmet"
import type { HelmetSizeOption } from "@/types/templates"

/**
 * Per-size availability and surcharge. Most helmets cost the same in every size, so the
 * prices here are usually zero — but an XXL shell that costs more can now say so, and a
 * size that's out of stock can be taken off sale without touching the rest.
 */
export function HelmetSizesForm({ model, sizes }: { model: HelmetModel; sizes: HelmetSizeOption[] }) {
  const rows = sizes.length > 0 ? sizes : model.sizes.map((size, index) => ({ modelId: model.id, size, price: 0, isActive: true, sortOrder: index + 1 }))

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HelmetSizesValues>({
    resolver: zodResolver(helmetSizesSchema),
    defaultValues: {
      modelId: model.id,
      sizes: rows.map(({ size, price, isActive, sortOrder }) => ({ size, price, isActive, sortOrder })),
    },
  })
  const { fields } = useFieldArray({ control, name: "sizes", keyName: "key" })

  async function onSubmit(values: HelmetSizesValues) {
    const result = await runAction(() => saveHelmetSizes(values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <AdminCard
        title={`${model.name} sizes`}
        description="Blank price means price on request. Switch a size off to stop offering it."
        flush
        action={
          <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Save
          </Button>
        }
      >
        <ul className="divide-y divide-carbon/10">
          {fields.map((field, index) => (
            <li key={field.key} className="grid grid-cols-[3rem_minmax(0,1fr)_4rem] items-center gap-3 px-5 py-3">
              <span className="font-display text-lg font-bold">{field.size}</span>
              <Controller
                control={control}
                name={`sizes.${index}.price`}
                render={({ field: price }) => (
                  <OptionPriceInput
                    value={price.value}
                    onChange={price.onChange}
                    onBlur={price.onBlur}
                    aria-label={`Surcharge for size ${field.size}, blank for price on request`}
                    aria-invalid={errors.sizes?.[index]?.price ? true : undefined}
                    className="h-10"
                  />
                )}
              />
              <Controller
                control={control}
                name={`sizes.${index}.isActive`}
                render={({ field: active }) => (
                  <div className="flex justify-end">
                    <Switch checked={active.value} onCheckedChange={active.onChange} aria-label={`Offer size ${field.size}`} />
                  </div>
                )}
              />
            </li>
          ))}
        </ul>
      </AdminCard>
    </form>
  )
}
