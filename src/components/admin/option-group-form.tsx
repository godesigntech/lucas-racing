"use client"

import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { updateOptionGroup } from "@/lib/actions/admin/catalog"
import { optionGroupSchema, type OptionGroupValues } from "@/lib/validations/admin"
import type { ConfiguratorOption, OptionGroupKey } from "@/types/catalog"

import { AdminCard } from "./admin-card"
import { OptionPriceInput } from "./money-input"

interface OptionGroupFormProps {
  group: OptionGroupKey
  title: string
  description: string
  options: ConfiguratorOption[]
}

/** Edit the label, surcharge and availability of every option in one configurator group. */
export function OptionGroupForm({ group, title, description, options }: OptionGroupFormProps) {
  const swatches = Object.fromEntries(options.map((option) => [option.value, option.swatch]))
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OptionGroupValues>({
    resolver: zodResolver(optionGroupSchema),
    defaultValues: {
      group,
      options: options.map(({ value, label, price, isActive }) => ({ value, label, price, isActive })),
    },
  })
  const { fields } = useFieldArray({ control, name: "options", keyName: "key" })

  async function onSubmit(values: OptionGroupValues) {
    const result = await runAction(() => updateOptionGroup(values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <AdminCard
        title={title}
        description={description}
        flush
        action={
          <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Save
          </Button>
        }
      >
        <div className="hidden grid-cols-[minmax(0,1fr)_9rem_5rem] gap-3 border-b border-carbon/10 px-5 py-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>Option</span>
          <span>Extra cost (blank = on request)</span>
          <span className="text-right">Offered</span>
        </div>
        <ul className="divide-y divide-carbon/10">
          {fields.map((field, index) => {
            const swatch = swatches[field.value]
            const rowErrors = errors.options?.[index]
            return (
              <li key={field.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_9rem_5rem]">
                <div className="flex min-w-0 items-center gap-3">
                  {swatch && (
                    <span className="size-7 shrink-0 rounded-full ring-1 ring-carbon/15" style={{ backgroundColor: swatch }} aria-hidden />
                  )}
                  <Input
                    {...register(`options.${index}.label`)}
                    aria-label={`Label for option ${index + 1}`}
                    aria-invalid={rowErrors?.label ? true : undefined}
                    className="h-10"
                  />
                </div>
                <Controller
                  control={control}
                  name={`options.${index}.isActive`}
                  render={({ field: active }) => (
                    <div className="flex justify-end sm:order-last">
                      <Switch
                        checked={active.value}
                        onCheckedChange={active.onChange}
                        aria-label={`Offer option ${index + 1}`}
                      />
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name={`options.${index}.price`}
                  render={({ field: price }) => (
                    <div className="col-span-2 sm:col-span-1">
                      <OptionPriceInput
                        value={price.value}
                        onChange={price.onChange}
                        onBlur={price.onBlur}
                        aria-label={`Extra cost for option ${index + 1}, blank for price on request`}
                        aria-invalid={rowErrors?.price ? true : undefined}
                        className="h-10"
                      />
                    </div>
                  )}
                />
              </li>
            )
          })}
        </ul>
      </AdminCard>
    </form>
  )
}
