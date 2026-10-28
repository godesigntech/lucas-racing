"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { FormField, fieldA11y } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { updateProductionSettings } from "@/lib/actions/admin/production"
import { productionSettingsSchema, type ProductionSettingsValues } from "@/lib/validations/production"
import type { ProductionSettings, RushTier } from "@/types/production"

/** How long a helmet takes, how many can start at once, and the rush master switch. */
export function ProductionSettingsForm({ settings, tiers }: { settings: ProductionSettings; tiers: RushTier[] }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductionSettingsValues>({
    resolver: zodResolver(productionSettingsSchema),
    defaultValues: settings,
  })

  const rushEnabled = useWatch({ control, name: "rushEnabled" })
  const sellable = tiers.filter((tier) => tier.key !== "standard" && tier.isActive && tier.fee !== null)

  async function onSubmit(values: ProductionSettingsValues) {
    const result = await runAction(() => updateProductionSettings(values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <AdminCard title="Production" description="The standard turnaround and how much work the workshop takes on.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="lead-weeks" label="Standard turnaround" hint="Weeks from the start date." error={errors.standardLeadWeeks?.message}>
            <Input type="number" min={1} max={52} {...register("standardLeadWeeks", { valueAsNumber: true })} {...fieldA11y("lead-weeks", errors.standardLeadWeeks?.message, true)} />
          </FormField>
          <FormField id="weekly-capacity" label="Helmets a week" hint="How many can start in one week." error={errors.weeklyCapacity?.message}>
            <Input type="number" min={0} {...register("weeklyCapacity", { valueAsNumber: true })} {...fieldA11y("weekly-capacity", errors.weeklyCapacity?.message, true)} />
          </FormField>
          <FormField id="lead-days" label="Earliest start" hint="Days' notice before work can begin." error={errors.bookingLeadDays?.message}>
            <Input type="number" min={0} {...register("bookingLeadDays", { valueAsNumber: true })} {...fieldA11y("lead-days", errors.bookingLeadDays?.message, true)} />
          </FormField>
          <FormField id="horizon" label="Book ahead" hint="How many weeks the calendar shows." error={errors.horizonWeeks?.message}>
            <Input type="number" min={1} max={104} {...register("horizonWeeks", { valueAsNumber: true })} {...fieldA11y("horizon", errors.horizonWeeks?.message, true)} />
          </FormField>
        </div>

        <div className="space-y-3 rounded-2xl bg-paddock/40 p-4">
          <label className="flex items-start justify-between gap-4">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Offer rush orders</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                While this is off, customers only see standard production, whatever the turnarounds below say.
              </span>
            </span>
            <Controller control={control} name="rushEnabled" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Offer rush orders" />} />
          </label>
          {rushEnabled && sellable.length === 0 && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              No turnaround is ready to sell yet. Give one a fee and switch it on below, or customers will still see
              standard production only.
            </p>
          )}
          {rushEnabled && sellable.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Customers can choose: {sellable.map((tier) => tier.label).join(", ")}.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Save production settings
          </Button>
        </div>
      </form>
    </AdminCard>
  )
}
