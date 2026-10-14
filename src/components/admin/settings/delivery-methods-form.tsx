"use client"

import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateDeliveryMethods } from "@/lib/actions/admin/settings"
import { deliveryMethodsSchema, type DeliveryMethodsValues } from "@/lib/validations/admin"
import type { DeliveryMethod } from "@/types/settings"

import { AdminCard } from "../admin-card"
import { MoneyInput } from "../money-input"

export function DeliveryMethodsForm({ methods }: { methods: DeliveryMethod[] }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DeliveryMethodsValues>({
    resolver: zodResolver(deliveryMethodsSchema),
    defaultValues: { methods },
  })
  const { fields, append, remove } = useFieldArray({ control, name: "methods", keyName: "key" })

  async function onSubmit(values: DeliveryMethodsValues) {
    const result = await runAction(() => updateDeliveryMethods(values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {fields.map((field, index) => {
        const rowErrors = errors.methods?.[index]
        const id = (name: string) => `delivery-${index}-${name}`
        return (
          <AdminCard
            key={field.key}
            title={`Delivery option ${index + 1}`}
            action={
              <div className="flex items-center gap-3">
                <Controller
                  control={control}
                  name={`methods.${index}.active`}
                  render={({ field: active }) => (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={id("active")} className="text-xs text-muted-foreground">
                        {active.value ? "Offered" : "Hidden"}
                      </Label>
                      <Switch id={id("active")} checked={active.value} onCheckedChange={active.onChange} />
                    </div>
                  )}
                />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)} aria-label={`Remove delivery option ${index + 1}`}>
                  <Trash2 />
                </Button>
              </div>
            }
          >
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <FormField id={id("label")} label="Name" error={rowErrors?.label?.message}>
                <Input {...register(`methods.${index}.label`)} {...fieldA11y(id("label"), rowErrors?.label?.message)} />
              </FormField>
              <Controller
                control={control}
                name={`methods.${index}.price`}
                render={({ field: price }) => (
                  <FormField id={id("price")} label="Price" error={rowErrors?.price?.message}>
                    <MoneyInput id={id("price")} value={price.value} onChange={price.onChange} onBlur={price.onBlur} />
                  </FormField>
                )}
              />
              <FormField id={id("description")} label="Description" optional className="sm:col-span-2">
                <Input {...register(`methods.${index}.description`)} id={id("description")} />
              </FormField>
              <Controller
                control={control}
                name={`methods.${index}.requiresAddress`}
                render={({ field: requires }) => (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <Checkbox
                      id={id("address")}
                      checked={requires.value}
                      onCheckedChange={(checked) => requires.onChange(checked === true)}
                    />
                    <Label htmlFor={id("address")} className="text-sm font-normal">
                      Ask for a delivery address at checkout
                    </Label>
                  </div>
                )}
              />
            </div>
          </AdminCard>
        )
      })}

      {errors.methods?.root?.message && <p className="text-sm font-medium text-destructive">{errors.methods.root.message}</p>}

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ id: "", label: "", description: "", price: 0, requiresAddress: true, active: true })}
          disabled={fields.length >= 8}
        >
          <Plus /> Add delivery option
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Save delivery options
        </Button>
      </div>
    </form>
  )
}
